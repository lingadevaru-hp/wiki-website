/**
 * Welcome + owner-alert email delivery directly from the Cloudflare Worker.
 *
 * Why raw SMTP: Workers have no nodemailer/Node sockets. Outbound TCP via
 * `cloudflare:sockets` to Zoho (465 implicit TLS, or 587 + STARTTLS) lets
 * the signup request itself fire the welcome email within seconds — the
 * GitHub cron (`newsletter-backfill.yml`) stays as the fallback for rows
 * still pending (welcome_email_sent_at IS NULL).
 *
 * Copy mirrors artifacts/api-server/src/services/emailService.ts. Subscriber
 * PII (names/emails) must never be logged — only the language + error kind.
 */

import { connect } from "cloudflare:sockets";

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

type WelcomeCopy = {
  subject: string;
  greeting: (firstName: string) => string;
  anonymousGreeting: string;
  message: string;
  signoff: string;
};

const FROM_ADDRESS = "newsletter@lingadevaru.in";

const WELCOME_COPY: Record<string, WelcomeCopy> = {
  en: {
    subject: "Thanks for subscribing!",
    greeting: (name) => `Hey ${name}, thanks for subscribing to my newsletter.`,
    anonymousGreeting: "Thanks for subscribing to my newsletter.",
    message:
      "You'll start getting letters from me. I appreciate your patience.",
    signoff: "Cheers, Lingadevaru",
  },
  kn: {
    subject: "ಚಂದಾದಾರರಾದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!",
    greeting: (name) =>
      `ನಮಸ್ಕಾರ ${name}, ನನ್ನ ಸುದ್ದಿಪತ್ರಕ್ಕೆ ಚಂದಾದಾರರಾದಕ್ಕೆ ಧನ್ಯವಾದಗಳು.`,
    anonymousGreeting: "ನನ್ನ ಸುದ್ದಿಪತ್ರಕ್ಕೆ ಚಂದಾದಾರರಾದಕ್ಕೆ ಧನ್ಯವಾದಗಳು.",
    message: "ನನ್ನಿಂದ ನಿಮಗೆ ಪತ್ರಗಳು ಬರಲಾರಂಭಿಸುತ್ತವೆ. ನಿಮ್ಮ ತಾಳ್ಮೆಗೆ ಧನ್ಯವಾದಗಳು.",
    signoff: "ಪ್ರೀತಿಯಿಂದ, ಲಿಂಗದೇವರು",
  },
  hi: {
    subject: "सदस्यता लेने के लिए धन्यवाद!",
    greeting: (name) =>
      `नमस्ते ${name}, मेरे न्यूज़लेटर की सदस्यता लेने के लिए धन्यवाद।`,
    anonymousGreeting: "मेरे न्यूज़लेटर से जुड़ने के लिए धन्यवाद।",
    message: "अब से आपको मेरे पत्र मिलने लगेंगे। आपके धैर्य के लिए धन्यवाद।",
    signoff: "शुभकामनाओं सहित, लिंगादेवरु",
  },
  ja: {
    subject: "ご登録ありがとうございます！",
    greeting: (name) =>
      `こんにちは、${name}さん。ニュースレターにご登録いただきありがとうございます。`,
    anonymousGreeting: "ニュースレターにご登録いただきありがとうございます。",
    message:
      "これから私からのお便りをお届けします。お待ちいただきありがとうございます。",
    signoff: "それでは、リンガデヴァル",
  },
  ml: {
    subject: "സബ്‌സ്‌ക്രൈബ് ചെയ്തതിന് നന്ദി!",
    greeting: (name) =>
      `നമസ്കാരം ${name}, എന്റെ വാർത്താക്കുറിപ്പിൽ ചേർന്നതിന് നന്ദി.`,
    anonymousGreeting: "എന്റെ വാർത്താക്കുറിപ്പിൽ ചേർന്നതിന് നന്ദി.",
    message:
      "ഇനി മുതൽ എന്റെ കത്തുകൾ നിങ്ങൾക്ക് ലഭിക്കും. കാത്തിരുന്നതിന് നന്ദി.",
    signoff: "സ്നേഹത്തോടെ, ലിംഗദേവരു",
  },
  ta: {
    subject: "சந்தா செய்ததற்கு நன்றி!",
    greeting: (name) =>
      `வணக்கம் ${name}, எனது செய்திமடலுக்கு சந்தா செய்ததற்கு நன்றி.`,
    anonymousGreeting: "எனது செய்திமடலுக்கு சந்தா செய்ததற்கு நன்றி.",
    message:
      "இனிமேல் என்னிடமிருந்து கடிதங்களைப் பெறுவீர்கள். உங்கள் பொறுமைக்கு நன்றி.",
    signoff: "அன்புடன், லிங்கதேவரு",
  },
  te: {
    subject: "సబ్‌స్క్రైబ్ చేసినందుకు ధన్యవాదాలు!",
    greeting: (name) =>
      `నమస్కారం ${name}, నా వార్తాలేఖకు సబ్‌స్క్రైబ్ చేసినందుకు ధన్యవాదాలు.`,
    anonymousGreeting: "నా వార్తాలేఖకు సబ్‌స్క్రైబ్ చేసినందుకు ధన్యవాదాలు.",
    message: "ఇకపై నా నుంచి మీకు లేఖలు అందుతాయి. మీ ఓపికకు ధన్యవాదాలు.",
    signoff: "శుభాకాంక్షలతో, లింగదేవరు",
  },
  gu: {
    subject: "સબ્સ્ક્રાઇબ કરવા બદલ આભાર!",
    greeting: (name) => `નમસ્તે ${name}, મારા ન્યૂઝલેટરમાં જોડાવા બદલ આભાર.`,
    anonymousGreeting: "મારા ન્યૂઝલેટરમાં જોડાવા બદલ આભાર.",
    message: "હવે તમને મારી તરફથી પત્રો મળતા રહેશે. ધીરજ રાખવા બદલ આભાર.",
    signoff: "સ્નેહપૂર્વક, લિંગદેવરુ",
  },
};

export function smtpConfigured(env: {
  ZOHO_SMTP_USER?: string;
  ZOHO_SMTP_PASSWORD?: string;
}): env is { ZOHO_SMTP_USER: string; ZOHO_SMTP_PASSWORD: string } {
  return Boolean(env.ZOHO_SMTP_USER && env.ZOHO_SMTP_PASSWORD);
}

export function ownerNotifyEmails(rawValue: string | undefined): string[] {
  const raw = rawValue || "dev@lingadevaru.in,newsletter@lingadevaru.in";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /.+@.+\..+/.test(value));
}

function utf8Base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa ships in the Workers runtime.
  return btoa(binary);
}

/** RFC 2047-encode non-ASCII subjects; leave plain-ASCII untouched. */
function encodeSubject(subject: string): string {
  if (/^[\x20-\x7e]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${utf8Base64(subject)}?=`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

type OutgoingMail = {
  fromName: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
};

function buildMessage(mail: OutgoingMail): string {
  const boundary = `thoshan-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
  const messageId = `<${Date.now().toString(36)}.${Math.floor(Math.random() * 0xffffffff).toString(36)}@lingadevaru.in>`;
  const lines = [
    `From: "${mail.fromName}" <${FROM_ADDRESS}>`,
    `To: ${mail.to.join(", ")}`,
    `Subject: ${encodeSubject(mail.subject)}`,
    `Message-ID: ${messageId}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    ...chunkBase64(utf8Base64(mail.text)),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    ...chunkBase64(utf8Base64(mail.html)),
    "",
    `--${boundary}--`,
    "",
  ];
  // SMTP mandates CRLF; dot-stuff any line starting with a period.
  return lines
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

function chunkBase64(b64: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < b64.length; i += 76) out.push(b64.slice(i, i + 76));
  return out;
}

const SMTP_TIMEOUT_MS = 20_000;

class SmtpError extends Error {
  constructor(
    message: string,
    public readonly reply: string,
  ) {
    super(message);
  }
}

/** Minimal SMTP client over a Workers TCP socket. Throws SmtpError on any unexpected reply. */
async function sendSmtpMail(config: SmtpConfig, mail: OutgoingMail): Promise<void> {
  const implicitTls = config.port === 465;
  // Port-465 style implicit TLS straight away; otherwise plain + STARTTLS.
  const socket = connect(`${config.host}:${config.port}`, {
    secureTransport: implicitTls ? "on" : "off",
  });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let closed = false;

  const close = async (): Promise<void> => {
    if (closed) return;
    closed = true;
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
    try {
      writer.releaseLock();
    } catch {
      /* already released */
    }
    try {
      await socket.close();
    } catch {
      /* best-effort */
    }
  };

  const withTimeout = async <T>(work: Promise<T>, what: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        work,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new SmtpError(`SMTP timed out (${what})`, "")),
            SMTP_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };

  const readLine = async (): Promise<string> => {
    for (;;) {
      const newline = buffer.indexOf("\n");
      if (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        return line.replace(/\r$/, "");
      }
      const { done, value } = await reader.read();
      if (done) throw new SmtpError("SMTP connection closed", buffer);
      buffer += decoder.decode(value, { stream: true });
    }
  };

  /** Read until `<code><space>`; returns the full reply text. */
  const readReply = async (): Promise<{ code: number; text: string }> => {
    const lines: string[] = [];
    for (;;) {
      const line = await readLine();
      lines.push(line);
      const match = line.match(/^(\d{3})([ -])/);
      if (!match) throw new SmtpError("Malformed SMTP reply", lines.join("\n"));
      if (match[2] === " ") {
        return { code: Number(match[1]), text: lines.join("\n") };
      }
    }
  };

  const command = async (text: string, expect: number): Promise<string> => {
    await writer.write(encoder.encode(`${text}\r\n`));
    const reply = await readReply();
    if (reply.code !== expect) {
      throw new SmtpError(
        `SMTP command failed: ${text.split(" ")[0]} -> ${reply.code}`,
        reply.text,
      );
    }
    return reply.text;
  };

  try {
    await withTimeout(
      (async () => {
        const greeting = await readReply();
        if (greeting.code !== 220) {
          throw new SmtpError("SMTP greeting failed", greeting.text);
        }
        await command("EHLO lingadevaru.in", 250);
        if (!implicitTls) {
          await command("STARTTLS", 220);
          await socket.startTls({ expectedServerHostname: config.host });
          await command("EHLO lingadevaru.in", 250);
        }
        const credentials = utf8Base64(
          `\u0000${config.user}\u0000${config.pass}`,
        );
        await command(`AUTH PLAIN ${credentials}`, 235);
        await command(`MAIL FROM:<${FROM_ADDRESS}>`, 250);
        for (const recipient of mail.to) {
          await command(`RCPT TO:<${recipient}>`, 250);
        }
        await command("DATA", 354);
        await writer.write(encoder.encode(`${buildMessage(mail)}\r\n.\r\n`));
        const dataReply = await readReply();
        if (dataReply.code !== 250) {
          throw new SmtpError("SMTP DATA rejected", dataReply.text);
        }
        try {
          await command("QUIT", 221);
        } catch {
          /* server may close first; delivery already accepted */
        }
      })(),
      "send",
    );
  } finally {
    await close();
  }
}

export type WelcomeSendArgs = {
  firstName: string;
  email: string;
  language: string;
  smtp: SmtpConfig;
  ownerEmails: string[];
  subscribedAt: string;
};

/**
 * Welcome email first, owner alert best-effort after — same ordering as the
 * cron fallback. Returns true only if Zoho accepted the welcome (caller
 * marks the row sent); false leaves the row pending for the cron retry.
 * Resolves silently on failure; never throws subscriber PII into logs.
 */
export async function sendWelcomeAndAlert(
  args: WelcomeSendArgs,
): Promise<boolean> {
  const copy = WELCOME_COPY[args.language] ?? WELCOME_COPY.en;
  const greeting = args.firstName
    ? copy.greeting(args.firstName)
    : copy.anonymousGreeting;
  try {
    await sendSmtpMail(args.smtp, {
      fromName: "Lingadevaru",
      to: [args.email],
      subject: copy.subject,
      text: `${greeting}\n\n${copy.message}\n\n${copy.signoff}`,
      html: `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(copy.message)}</p><p>${escapeHtml(copy.signoff)}</p>`,
    });
  } catch (error) {
    console.error(
      `[newsletter] welcome send failed (language=${args.language}): ${
        error instanceof SmtpError ? error.message : "transport error"
      }`,
    );
    return false;
  }

  if (args.ownerEmails.length === 0) return;
  const displayName = args.firstName || "(not provided)";
  const ownerText =
    `A new subscriber joined the newsletter.\n\n` +
    `Name: ${displayName}\nEmail: ${args.email}\nLanguage: ${args.language}\nSubscribed: ${args.subscribedAt}`;
  try {
    await sendSmtpMail(args.smtp, {
      fromName: "Lingadevaru Newsletter",
      to: args.ownerEmails,
      subject: `New newsletter subscriber (${args.language}): ${displayName}`,
      text: ownerText,
      html:
        `<p>A new subscriber joined the newsletter.</p>` +
        `<ul><li>Name: ${escapeHtml(displayName)}</li>` +
        `<li>Email: ${escapeHtml(args.email)}</li>` +
        `<li>Language: ${escapeHtml(args.language)}</li>` +
        `<li>Subscribed: ${escapeHtml(args.subscribedAt)}</li></ul>`,
    });
  } catch {
    // Owner alert is best-effort: the subscriber is still marked sent.
    console.error(`[newsletter] owner alert failed (language=${args.language})`);
  }
  return true;
}
