import { auth } from "@/lib/firebase";

const WORKER_URL = import.meta.env.VITE_WORKER_URL?.trim() || "http://127.0.0.1:8787";

export class WorkerError extends Error {}

async function callWorker<T>(path: string, body: unknown): Promise<T> {
  if (!auth.currentUser) throw new WorkerError("Sign in required.");
  const token = await auth.currentUser.getIdToken();

  const res = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new WorkerError((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface GenerateEmailInput {
  emailType: string;
  tone: string;
  purpose: string;
  brandName?: string;
  mainMessage: string;
  extraInstructions?: string;
}

export interface GenerateEmailResult {
  subject: string;
  bodyText: string;
}

export function generateEmail(input: GenerateEmailInput) {
  return callWorker<GenerateEmailResult>("/generate-email", input);
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export function askAssistant(message: string, history: AssistantMessage[]) {
  return callWorker<{ reply: string }>("/assistant", { message, history });
}
