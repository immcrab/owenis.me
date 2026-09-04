import { z } from "zod";

export const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "app", "admin", "mail", "email", "smtp", "imap", "pop",
  "ftp", "ssh", "root", "owenis", "dashboard", "auth", "login", "signup",
  "static", "assets", "cdn", "docs", "help", "support", "status", "blog",
  "dev", "staging", "prod", "test", "ns1", "ns2", "mx", "webmail",
]);

export const subdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Must be at least 3 characters")
  .max(30, "Must be 30 characters or fewer")
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "Only lowercase letters, numbers, and hyphens — cannot start or end with a hyphen",
  )
  .refine((v) => !v.includes("--"), "Cannot contain consecutive hyphens")
  .refine((v) => !RESERVED_SUBDOMAINS.has(v), "This subdomain is reserved");

export const firebaseProjectIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(6, "Firebase project IDs are at least 6 characters")
  .max(30, "Firebase project IDs are at most 30 characters")
  .regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$/,
    "Must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens",
  );

export const urlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL, including https://")
  .refine((v) => v.startsWith("https://") || v.startsWith("http://localhost"), {
    message: "Must use https:// (http://localhost is allowed for testing)",
  });

export const connectProjectSchema = z.object({
  firebaseProjectId: firebaseProjectIdSchema,
  displayName: z.string().trim().min(2).max(60),
  webApiKey: z.string().trim().max(200).optional().or(z.literal("")),
  authDomain: z.string().trim().max(200).optional().or(z.literal("")),
});

export const emailTemplateSchema = z.object({
  subject: z.string().trim().min(3, "Subject is required").max(150),
  senderName: z.string().trim().min(1, "Sender name is required").max(80),
  replyTo: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(200)
    .optional()
    .or(z.literal("")),
  bodyHtml: z.string().trim().min(10, "Body is required").max(20000),
});

export const actionUrlsSchema = z.object({
  continueUrl: urlSchema,
  customDomain: z.string().trim().max(200).optional().or(z.literal("")),
});

export const subdomainRequestSchema = z.object({
  requestedSubdomain: subdomainSchema,
  projectId: z.string().trim().min(1, "Select a connected project"),
});

export function safeParse<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) return { success: true, data: result.data };
  const first = result.error.issues[0];
  return { success: false, error: first?.message ?? "Invalid value" };
}
