import nodemailer from 'nodemailer';
import { EmailConfig } from 'next-auth/providers/email';

export function customEmailProvider(options: Partial<EmailConfig>) {
    return {
      id: options.id ?? 'email',
      type: options.type ?? 'email',
      name: options.name ?? 'Email',
      server: options.server,
      from: options.from,
      maxAge: options.maxAge ?? 24 * 60 * 60, // default 1 day in seconds
      sendVerificationRequest: async ({ identifier, url, provider }: { identifier: string, url: string, provider: EmailConfig }) => {
        const { server, from } = provider;
        console.log('Creating transporter with:', server);
        
        // Create transporter
        const transport = nodemailer.createTransport(server);
        
        // Email content
        const { host } = new URL(url);
        const subject = `Sign in to ${host}`;
        const text = `Please click the link below to sign in:\n${url}\n\n`;
        const html = `<p>Please click the link below to sign in:</p><p><a href="${url}">Sign in</a></p>`;
        
        try {
          console.log('Attempting to send email to:', identifier);
          const result = await transport.sendMail({
            to: identifier,
            from,
            subject,
            text,
            html,
          });
          console.log('Email sent successfully:', result);
        } catch (error) {
          console.error('Error sending email:', error);
          throw error;
        }
      },
    };
}