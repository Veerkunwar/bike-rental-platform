import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = env.email.host
  ? nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465, // true for port 465 (implicit TLS), false for 587/25 (STARTTLS)
      auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    // No SMTP configured yet: log instead of failing the request, so the
    // rest of the flow (registration, booking, etc.) still works in dev.
    // eslint-disable-next-line no-console
    console.log(`[email:mock] to=${to} subject="${subject}"`);
    return;
  }

  try {
    await transporter.sendMail({ from: env.email.from, to, subject, html });
  } catch (err) {
    // Email delivery failure should never break registration/booking flows —
    // log it and move on rather than throwing.
    // eslint-disable-next-line no-console
    console.error(`[email] Failed to send to ${to}:`, err);
  }
}

export const emailTemplates = {
  verifyEmail: (link: string) => `
    <h2>Verify your email</h2>
    <p>Click the link below to verify your Bike Rental account:</p>
    <a href="${link}">${link}</a>
  `,
  resetPassword: (link: string) => `
    <h2>Reset your password</h2>
    <p>This link expires in 1 hour:</p>
    <a href="${link}">${link}</a>
  `,
  bookingConfirmed: (bookingId: string) => `
    <h2>Booking Confirmed</h2>
    <p>Your booking <strong>${bookingId}</strong> is confirmed. Have a great ride!</p>
  `,
  documentRejected: (docName: string, reason: string) => `
    <h2>Document Rejected</h2>
    <p>Your <strong>${docName}</strong> was rejected: ${reason}</p>
    <p>Please re-upload it from Profile → Documents.</p>
  `,
};
