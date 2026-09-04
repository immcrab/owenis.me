export interface AiSettings {
  model: string;
  assistantModel: string;
  systemPromptEmail: string;
  systemPromptAssistant: string;
  maxTokensPerRequest: number;
  dailyCallLimitPerUser: number;
  enabled: boolean;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  model: "openai/gpt-oss-120b",
  assistantModel: "openai/gpt-oss-20b",
  systemPromptEmail: "You are an assistant that drafts professional marketing and transactional emails.",
  systemPromptAssistant: "You are the help assistant for owenis.me.",
  maxTokensPerRequest: 800,
  dailyCallLimitPerUser: 30,
  enabled: true,
};

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { nullValue: null };

function unwrap(value: FirestoreValue | undefined): string | number | boolean | null | undefined {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("booleanValue" in value) return value.booleanValue;
  return null;
}

/**
 * Reads the admin-configured AI settings straight from Firestore's public
 * REST API (the aiSettings/config doc is publicly readable, admin-write-only
 * — see firestore.rules). No service account needed for a plain read.
 */
export async function fetchAiSettings(projectId: string): Promise<AiSettings> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/aiSettings/config`,
    );
    if (!res.ok) return DEFAULT_AI_SETTINGS;

    const doc = (await res.json()) as { fields?: Record<string, FirestoreValue> };
    const fields = doc.fields ?? {};

    return {
      model: (unwrap(fields.model) as string) ?? DEFAULT_AI_SETTINGS.model,
      assistantModel: (unwrap(fields.assistantModel) as string) ?? DEFAULT_AI_SETTINGS.assistantModel,
      systemPromptEmail: (unwrap(fields.systemPromptEmail) as string) ?? DEFAULT_AI_SETTINGS.systemPromptEmail,
      systemPromptAssistant:
        (unwrap(fields.systemPromptAssistant) as string) ?? DEFAULT_AI_SETTINGS.systemPromptAssistant,
      maxTokensPerRequest: (unwrap(fields.maxTokensPerRequest) as number) ?? DEFAULT_AI_SETTINGS.maxTokensPerRequest,
      dailyCallLimitPerUser:
        (unwrap(fields.dailyCallLimitPerUser) as number) ?? DEFAULT_AI_SETTINGS.dailyCallLimitPerUser,
      enabled: (unwrap(fields.enabled) as boolean) ?? DEFAULT_AI_SETTINGS.enabled,
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}
