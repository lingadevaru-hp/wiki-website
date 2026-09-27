import nodemailer, { type Transporter } from "nodemailer";

export const NEWSLETTER_LANGUAGES = [
  "en",
  "kn",
  "hi",
  "ja",
  "ml",
  "ta",
  "te",
  "gu",
] as const;

type NewsletterLanguage = (typeof NEWSLETTER_LANGUAGES)[number];

type WelcomeCopy = {
  subject: string;
  greeting: (firstName: string) => string;
  message: string;
  signoff: string;
};

const FROM_ADDRESS = "newsletter@lingadevaru.in";

const WELCOME_COPY: Record<NewsletterLanguage, WelcomeCopy> = {
  en: {
    subject: "Thanks for subscribing!",
    greeting: (name) => `Hey ${name}, thanks for subscribing to my newsletter.`,
    message:
      "You'll start getting letters from me. I appreciate your patience.",
    signoff: "Cheers, Lingadevaru",
  },
  kn: {
    subject: "ಚಂದಾದಾರರಾದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!",
    greeting: (name) => `ನಮಸ್ಕಾರ ${name}, ನನ್ನ ಸುದ್ದಿಪತ್ರಕ್ಕೆ ಚಂದಾದಾರರಾದಕ್ಕೆ ಧನ್ಯವಾದಗಳು.`,
    message: "ನನ್ನಿಂದ ನಿಮಗೆ ಪತ್ರಗಳು ಬರಲಾರಂಭಿಸುತ್ತವೆ. ನಿಮ್ಮ ತಾಳ್ಮೆಗೆ ಧನ್ಯವಾದಗಳು.",
    signoff: "ಪ್ರೀತಿಯಿಂದ, ಲಿಂಗದೇವರು",
  },
  hi: {
    subject: "सदस्यता लेने के लिए धन्यवाद!",
    greeting: (name) => `नमस्ते ${name}, मेरे न्यूज़लेटर की सदस्यता लेने के लिए धन्यवाद।`,
    message: "अब से आपको मेरे पत्र मिलने लगेंगे। आपके धैर्य के लिए धन्यवाद।",
    signoff: "शुभकामनाओं सहित, लिंगादेवरु",
  },
  ja: {
    subject: "ご登録ありがとうございます！",
    greeting: (name) => `こんにちは、${name}さん。ニュースレターにご登録いただきありがとうございます。`,
    message: "これから私からのお便りをお届けします。お待ちいただきありがとうございます。",
    signoff: "それでは、リンガデヴァル",
  },
  ml: {
    subject: "സബ്‌സ്‌ക്രൈബ് ചെയ്തതിന് നന്ദി!",
    greeting: (name) => `നമസ്കാരം ${name}, എന്റെ വാർത്താക്കുറിപ്പിൽ ചേർന്നതിന് നന്ദി.`,
    message: "ഇനി മുതൽ എന്റെ കത്തുകൾ നിങ്ങൾക്ക് ലഭിക്കും. കാത്തിരുന്നതിന് നന്ദി.",
    signoff: "സ്നേഹത്തോടെ, ലിംഗദേവരു",
  },
  ta: {
    subject: "சந்தா செய்ததற்கு நன்றி!",
    greeting: (name) => `வணக்கம் ${name}, எனது செய்திமடலுக்கு சந்தா செய்ததற்கு நன்றி.`,
    message: "இனிமேல் என்னிடமிருந்து கடிதங்களைப் பெறுவீர்கள். உங்கள் பொறுமைக்கு நன்றி.",
    signoff: "அன்புடன், லிங்கதேவரு",
  },
  te: {
    subject: "సబ్‌స్క్రైబ్ చేసినందుకు ధన్యవాదాలు!",
    greeting: (name) => `నమస్కారం ${name}, నా వార్తాలేఖకు సబ్‌స్క్రైబ్ చేసినందుకు ధన్యవాదాలు.`,
    message: "ఇకపై నా నుంచి మీకు లేఖలు అందుతాయి. మీ ఓపికకు ధన్యవాదాలు.",
    signoff: "శుభాకాంక్షలతో, లింగదేవరు",
  },
  gu: {
    subject: "સબ્સ્ક્રાઇબ કરવા બદલ આભાર!",
    greeting: (name) => `નમસ્તે ${name}, મારા ન્યૂઝલેટરમાં જોડાવા બદલ આભાર.`,
    message: "હવે તમને મારી તરફથી પત્રો મળતા રહેશે. ધીરજ રાખવા બદલ આભાર.",
    signoff: "સ્નેહપૂર્વક, લિંગદેવરુ",
  },
};

function isNewsletterLanguage(value: string): value is NewsletterLanguage {
  return Object.hasOwn(WELCOME_COPY, value);
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "ZOHO_SMTP_USER and ZOHO_SMTP_PASSWORD must be configured.",
    );
  }

  const host = process.env.ZOHO_SMTP_HOST || "smtp.zoho.in";
  const port = Number(process.env.ZOHO_SMTP_PORT || "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("ZOHO_SMTP_PORT must be a valid TCP port.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
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

export async function sendNewsletterWelcomeEmail({
  firstName,
  email,
  language,
}: {
  firstName: string;
  email: string;
  language: string;
}): Promise<void> {
  const copy = isNewsletterLanguage(language)
    ? WELCOME_COPY[language]
    : WELCOME_COPY.en;
  const greeting = copy.greeting(firstName);
  const transporter = getTransporter();

  await transporter.sendMail({
    from: { name: "Lingadevaru", address: FROM_ADDRESS },
    to: email,
    subject: copy.subject,
    text: `${greeting}\n\n${copy.message}\n\n${copy.signoff}`,
    html: `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(copy.message)}</p><p>${escapeHtml(copy.signoff)}</p>`,
  });
}
