import { ServiceUnavailableException } from '@nestjs/common';

export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmChatOptions = {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

function resolveConfig(modelOverride?: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = modelOverride?.trim() || process.env.AI_DEFAULT_MODEL?.trim() || 'gpt-4o-mini';
  return { apiKey, baseUrl, model };
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getLlmConfig() {
  const { baseUrl, model } = resolveConfig();
  return {
    configured: isLlmConfigured(),
    baseUrl,
    defaultModel: model,
    provider: 'openai-compatible',
  };
}

export async function llmChatCompletion(
  messages: LlmMessage[],
  options: LlmChatOptions = {},
): Promise<string> {
  const { apiKey, baseUrl, model } = resolveConfig(options.model);
  if (!apiKey) {
    throw new ServiceUnavailableException({
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message:
          'AI is not configured. Set OPENAI_API_KEY in the API environment (Cursor Pro does not provide an in-app API key).',
      },
    });
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.65,
      max_tokens: options.maxTokens ?? 4096,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new ServiceUnavailableException({
      success: false,
      error: {
        code: 'AI_PROVIDER_ERROR',
        message: json.error?.message || `LLM request failed (${res.status})`,
      },
    });
  }

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ServiceUnavailableException({
      success: false,
      error: { code: 'AI_EMPTY_RESPONSE', message: 'LLM returned an empty response.' },
    });
  }

  return content;
}

export function parseJsonResponse<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(body) as T;
}
