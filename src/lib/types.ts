import type { Timestamp } from "firebase/firestore";

export type SubdomainStatus = "pending" | "approved" | "denied" | "needs_changes";

export type ProjectStatus = "pending_setup" | "connected" | "needs_attention";

export type EmailTemplateType =
  | "verify_email"
  | "password_reset"
  | "email_address_change"
  | "sms_verification";

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  verify_email: "Email address verification",
  password_reset: "Password reset",
  email_address_change: "Email address change",
  sms_verification: "SMS verification",
};

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  disabled: boolean;
  isAdmin: boolean;
  aiCallsToday: number;
  aiCallsResetAt: Timestamp | null;
}

export interface DnsRecord {
  type: "TXT" | "CNAME" | "A" | "MX";
  host: string;
  value: string;
  purpose: string;
  verified: boolean;
  priority?: number;
}

export interface ActionUrls {
  continueUrl: string;
  customDomain: string | null;
}

export interface FirebaseProjectDoc {
  id: string;
  ownerId: string;
  firebaseProjectId: string;
  displayName: string;
  webApiKey: string | null;
  authDomain: string | null;
  status: ProjectStatus;
  publicListing: boolean;
  publicDescription: string | null;
  actionUrls: ActionUrls;
  dnsRecords: DnsRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EmailTemplateDoc {
  id: EmailTemplateType;
  projectId: string;
  subject: string;
  senderName: string;
  replyTo: string | null;
  bodyHtml: string;
  updatedAt: Timestamp;
}

export interface SubdomainRequestDoc {
  id: string;
  userId: string;
  projectId: string | null;
  requestedSubdomain: string;
  status: SubdomainStatus;
  adminMessage: string | null;
  dnsRecords: DnsRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewedBy: string | null;
}

export interface ActivityLogDoc {
  id: string;
  userId: string | null;
  actorEmail: string | null;
  action: string;
  meta: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface AiSettingsDoc {
  provider: "groq";
  model: string;
  assistantModel: string;
  systemPromptEmail: string;
  systemPromptAssistant: string;
  maxTokensPerRequest: number;
  dailyCallLimitPerUser: number;
  enabled: boolean;
  updatedAt: Timestamp | null;
}

export interface PublicProjectDoc {
  id: string;
  displayName: string;
  subdomain: string | null;
  description: string;
  joinedAt: Timestamp;
}

export const GROQ_MODELS = [
  { id: "groq/compound", label: "Groq Compound (agentic, tool-using)" },
  { id: "openai/gpt-oss-120b", label: "OpenAI OSS 120B (highest quality)" },
  { id: "openai/gpt-oss-20b", label: "OpenAI OSS 20B (fastest)" },
] as const;

export type GroqModelId = (typeof GROQ_MODELS)[number]["id"];
