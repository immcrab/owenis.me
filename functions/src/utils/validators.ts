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
  .min(3)
  .max(30)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
  .refine((v) => !v.includes("--"))
  .refine((v) => !RESERVED_SUBDOMAINS.has(v));

export const firebaseProjectIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(6)
  .max(30)
  .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/);

export const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(255)
  .regex(/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, "Must be a valid domain name");

export const urlSchema = z
  .string()
  .trim()
  .url()
  .refine((v) => v.startsWith("https://") || v.startsWith("http://localhost"));

export const connectProjectSchema = z.object({
  firebaseProjectId: firebaseProjectIdSchema,
  displayName: z.string().trim().min(2).max(60),
  webApiKey: z.string().trim().max(200).optional().or(z.literal("")),
  authDomain: z.string().trim().max(200).optional().or(z.literal("")),
});

export const actionUrlsSchema = z.object({
  continueUrl: urlSchema,
  customDomain: z.string().trim().max(200).optional().or(z.literal("")),
});

export const emailTemplateTypes = ["verify_email", "password_reset", "email_address_change", "sms_verification"] as const;

export const emailTemplateSchema = z.object({
  templateType: z.enum(emailTemplateTypes),
  subject: z.string().trim().min(3).max(150),
  senderName: z.string().trim().min(1).max(80),
  replyTo: z.string().trim().email().max(200).optional().or(z.literal("")),
  bodyHtml: z.string().trim().min(10).max(20000),
});

export const groqModelIds = ["groq/compound", "openai/gpt-oss-120b", "openai/gpt-oss-20b"] as const;

export const aiSettingsSchema = z.object({
  model: z.enum(groqModelIds),
  assistantModel: z.enum(groqModelIds),
  systemPromptEmail: z.string().trim().min(1).max(2000),
  systemPromptAssistant: z.string().trim().min(1).max(2000),
  maxTokensPerRequest: z.number().int().min(100).max(4000),
  dailyCallLimitPerUser: z.number().int().min(1).max(1000),
  enabled: z.boolean(),
});

export const generateEmailSchema = z.object({
  emailType: z.string().trim().min(1).max(60),
  tone: z.string().trim().min(1).max(60),
  purpose: z.string().trim().min(1).max(300),
  brandName: z.string().trim().max(100).optional().or(z.literal("")),
  mainMessage: z.string().trim().min(1).max(2000),
  extraInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
});
