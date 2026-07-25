import "server-only";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Читальня <onboarding@resend.dev>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set — email sending is not configured yet.",
    );
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({ from: FROM, to: args.to, subject: args.subject, html: args.html });
}
