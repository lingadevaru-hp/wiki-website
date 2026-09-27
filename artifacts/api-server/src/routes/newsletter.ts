import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, newsletterSubscribers } from "@workspace/db";
import {
  NEWSLETTER_LANGUAGES,
  sendNewsletterWelcomeEmail,
} from "../services/emailService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(80)
    .refine((name) => !/[\r\n\0]/.test(name))
    .optional()
    .default(""),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  language: z.enum(NEWSLETTER_LANGUAGES),
});

class WelcomeEmailDeliveryError extends Error {
  constructor(cause: unknown) {
    super("Newsletter welcome email delivery failed", { cause });
  }
}

function errorCode(error: unknown): string {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  if (error instanceof Error) return error.name;
  return "UnknownError";
}

router.post("/newsletter/signup", async (req, res) => {
  const proxyToken = process.env.NEWSLETTER_PROXY_TOKEN;
  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
    if (!proxyToken) {
      return res.status(503).json({
        error: "Newsletter service is not configured",
      });
    }
    if (req.get("X-Newsletter-Proxy-Token") !== proxyToken) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Enter a valid email address and supported language.",
    });
  }

  const { firstName, email, language } = parsed.data;

  try {
    await db
      .insert(newsletterSubscribers)
      .values({ firstName, email, language })
      .onConflictDoNothing({ target: newsletterSubscribers.email });

    await db.transaction(async (tx) => {
      const [subscriber] = await tx
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .for("update");

      if (!subscriber) {
        throw new Error("Newsletter subscriber was not available after insert.");
      }

      if (subscriber.welcomeEmailSentAt) return;

      try {
        await sendNewsletterWelcomeEmail({
          firstName: subscriber.firstName,
          email: subscriber.email,
          language: subscriber.language,
        });
      } catch (cause) {
        throw new WelcomeEmailDeliveryError({ cause });
      }

      await tx
        .update(newsletterSubscribers)
        .set({ welcomeEmailSentAt: new Date() })
        .where(
          and(
            eq(newsletterSubscribers.id, subscriber.id),
            isNull(newsletterSubscribers.welcomeEmailSentAt),
          ),
        );
    });

    return res.status(200).json({
      message: "Thanks for subscribing. Your welcome email is on its way.",
    });
  } catch (error) {
    if (error instanceof WelcomeEmailDeliveryError) {
      logger.error(
        { errorCode: errorCode(error.cause) },
        "Newsletter welcome email delivery failed",
      );
      return res.status(502).json({
        error:
          "Your subscription was saved, but the welcome email could not be sent. Please try again.",
      });
    }

    logger.error(
      { errorCode: errorCode(error) },
      "Newsletter signup failed",
    );
    return res.status(500).json({
      error: "We could not complete your subscription. Please try again.",
    });
  }
});

export default router;
