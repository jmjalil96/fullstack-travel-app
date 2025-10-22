import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './database.js';
import { env } from './env.js';
import nodemailer from 'nodemailer';

// Create email transporter for Inbucket (SMTP test server)
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2500,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      await transporter.sendMail({
        from: 'noreply@travelapp.com',
        to: user.email,
        subject: 'Reset your password',
        html: `
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${url}">${url}</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    },
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
      await transporter.sendMail({
        from: 'noreply@travelapp.com',
        to: user.email,
        subject: 'Verify your email address',
        html: `
          <h2>Verify Your Email</h2>
          <p>Welcome! Please verify your email address to complete your registration:</p>
          <a href="${url}">${url}</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});
