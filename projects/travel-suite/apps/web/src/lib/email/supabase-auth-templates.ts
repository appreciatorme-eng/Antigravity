/**
 * Branded HTML templates for Supabase Auth emails.
 *
 * These use Supabase template variables ({{ .ConfirmationURL }}, {{ .SiteURL }})
 * and must be applied via the Supabase dashboard (Auth → Email Templates).
 *
 * Design matches BaseEmail.tsx: teal gradient header, white card, teal CTA, footer.
 */

const SHARED_STYLES = `
  body { background-color: #eef2ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 32px 0; }
  .container { background-color: #ffffff; border-radius: 24px; margin: 0 auto; max-width: 640px; overflow: hidden; }
  .header { background: linear-gradient(135deg, rgba(8,18,32,1) 0%, rgba(15,118,110,1) 100%); padding: 32px 36px; }
  .brand { color: #99f6e4; font-size: 12px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; margin: 0 0 12px; }
  .title { color: #ffffff; font-size: 28px; line-height: 34px; margin: 0; font-weight: 700; }
  .content { padding: 32px 36px; color: #0f172a; font-size: 15px; line-height: 1.6; }
  .content p { margin: 0 0 16px; }
  .cta { display: inline-block; background-color: #0f766e; border-radius: 14px; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 20px; text-decoration: none; margin-top: 12px; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 0 36px 24px; }
  .footer { color: #64748b; font-size: 12px; line-height: 18px; padding: 0 36px 32px; }
  .footer p { margin: 0 0 8px; }
`;

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="brand">TripBuilt</p>
      <h1 class="title">${title}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <hr class="divider" />
    <div class="footer">
      <p>&copy; TripBuilt</p>
    </div>
  </div>
</body>
</html>`;
}

export const emailConfirmationTemplate = wrapTemplate(
  "Verify Your Email",
  `<p>Thanks for signing up with TripBuilt. Please confirm your email address to get started.</p>
   <p><a href="{{ .ConfirmationURL }}" class="cta">Verify Email</a></p>
   <p style="color:#64748b;font-size:13px;margin-top:24px;">If you didn't create an account, you can safely ignore this email.</p>`
);

export const passwordResetTemplate = wrapTemplate(
  "Reset Your Password",
  `<p>We received a request to reset your password. Click the button below to choose a new one.</p>
   <p><a href="{{ .ConfirmationURL }}" class="cta">Reset Password</a></p>
   <p style="color:#64748b;font-size:13px;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>`
);

export const magicLinkTemplate = wrapTemplate(
  "Sign In to TripBuilt",
  `<p>Click the button below to sign in to your TripBuilt account. This link expires in 10 minutes.</p>
   <p><a href="{{ .ConfirmationURL }}" class="cta">Sign In</a></p>
   <p style="color:#64748b;font-size:13px;margin-top:24px;">If you didn't request this link, you can safely ignore this email.</p>`
);

export const inviteTemplate = wrapTemplate(
  "You're Invited",
  `<p>You've been invited to join TripBuilt. Click below to accept the invitation and set up your account.</p>
   <p><a href="{{ .ConfirmationURL }}" class="cta">Accept Invite</a></p>
   <p style="color:#64748b;font-size:13px;margin-top:24px;">If you weren't expecting this invitation, you can safely ignore this email.</p>`
);
