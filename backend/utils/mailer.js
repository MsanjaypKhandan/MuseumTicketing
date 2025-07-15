import nodemailer from "nodemailer";
import { logger } from "../middleware/logger.js";

/**
 * Shared SMTP transport. Created lazily so the app can boot (and tests can
 * import modules) without valid SMTP credentials. In production the
 * transport would be swapped for a provider SDK (SendGrid/SES) behind this
 * same sendMail interface.
 */
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, text, attachments }) => {
  const mailOptions = {
    from: `"HistoriScan" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text,
    attachments,
  };
  const info = await getTransporter().sendMail(mailOptions);
  logger.info("email.sent", { to, subject });
  return info;
};
