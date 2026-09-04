export const PLATFORM_DOMAIN = "owenis.me";

export const ADMIN_EMAIL = "imcrabfr@gmail.com";

export const EMAIL_TEMPLATE_HELP: Record<string, string> = {
  verify_email:
    "Sent when a new user needs to confirm their email address before signing in.",
  password_reset:
    "Sent when a user requests a password reset link.",
  email_address_change:
    "Sent to a user's old address when their account email is changed, so they can undo it if it wasn't them.",
  sms_verification:
    "Sent as part of SMS/phone multi-factor verification, if enabled on the Firebase project.",
};

export const TEMPLATE_VARIABLES = [
  { token: "%DISPLAY_NAME%", description: "The user's display name, if set" },
  { token: "%EMAIL%", description: "The user's email address" },
  { token: "%APP_NAME%", description: "Your app/project display name" },
  { token: "%LINK%", description: "The action link (verify / reset / etc.)" },
];

export const DNS_RECORD_PURPOSES: Record<string, string> = {
  ownership: "Proves you control this domain before we activate custom email sending.",
  spf: "Authorizes your email provider to send mail on behalf of this domain (recommended).",
  dmarc: "Tells receiving mail servers what to do with mail that fails authentication (recommended).",
};

export const ACTION_URL_HELP =
  "This is the page users land on after clicking a Firebase Auth email link (verify email, reset password, etc.). It should point to a route in your app that reads the oobCode from the URL and calls the Firebase Auth SDK to complete the action.";
