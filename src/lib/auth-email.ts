import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail({
  identifier,
  url,
}: {
  identifier: string; // the user's e-mail
  url: string;        // magic-link URL
}) {
  const escapedEmail = identifier.replace(/\./g, '&#8203;.');

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,          // no-reply@bulletbuilder.net
    to: identifier,
    subject: 'Sign in to Bullet Builder 2.0',
    html: `
      <p>Hi&nbsp;${escapedEmail},</p>
      <p>Click the link below to sign in:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link will expire in 10&nbsp;minutes.</p>
      <p>— The Bullet Builder team</p>
    `,
    text: `Sign in to Bullet Builder 2.0:\n${url}\n\nLink expires in 10 minutes.`,
  });
}
