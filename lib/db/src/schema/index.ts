import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  language: varchar("language", { length: 5 }).notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  welcomeEmailSentAt: timestamp("welcome_email_sent_at", {
    withTimezone: true,
  }),
});