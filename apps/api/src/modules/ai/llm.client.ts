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

export type LlmRequestConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export class LlmProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code = 'AI_PROVIDER_ERROR',
  ) {
    super(message);
    this.name = 'LlmProviderError';
  }
}

function providerErrorMessage(payload: unknown, fallback: string): string {
  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => providerErrorMessage(item, ''))
      .filter((message) => message.length > 0);
    return messages.join('; ') || fallback;
  }
  if (typeof payload === 'string') return payload.trim() || fallback;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['message', 'detail', 'error', 'errors']) {
      if (record[key] !== undefined) {
        const message = providerErrorMessage(record[key], '');
        if (message) return message;
      }
    }
  }
  return fallback;
}

export async function llmChatCompletion(
  messages: LlmMessage[],
  config: LlmRequestConfig,
  options: LlmChatOptions = {},
): Promise<string> {
  const { apiKey, baseUrl } = config;
  const model = options.model?.trim() || config.model;

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
    error?: unknown;
  };

  if (!res.ok) {
    throw new LlmProviderError(
      providerErrorMessage(json.error ?? json, `LLM request failed (${res.status})`),
      res.status,
    );
  }

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new LlmProviderError('LLM returned an empty response.', res.status, 'AI_EMPTY_RESPONSE');
  }

  return content;
}

export type LlmImageResult = {
  buffer: Buffer;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  revisedPrompt?: string;
};

/**
 * OpenAI-compatible image generation (`POST /images/generations`).
 * Works with OpenAI and providers that expose the same route.
 */
export async function llmImageGeneration(
  prompt: string,
  config: LlmRequestConfig,
  options: {
    size?: '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792';
    model?: string;
  } = {},
): Promise<LlmImageResult> {
  const { apiKey, baseUrl } = config;
  const model = options.model?.trim() || config.model;
  const size = options.size ?? '1536x1024';

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size,
      response_format: 'b64_json',
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
    error?: unknown;
  };

  if (!res.ok) {
    throw new LlmProviderError(
      providerErrorMessage(json.error ?? json, `Image generation failed (${res.status})`),
      res.status,
      'AI_IMAGE_PROVIDER_ERROR',
    );
  }

  const item = json.data?.[0];
  if (!item) {
    throw new LlmProviderError(
      'Image provider returned no image data.',
      res.status,
      'AI_EMPTY_RESPONSE',
    );
  }

  if (item.b64_json) {
    return {
      buffer: Buffer.from(item.b64_json, 'base64'),
      mimeType: 'image/png',
      revisedPrompt: item.revised_prompt,
    };
  }

  if (item.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) {
      throw new LlmProviderError(
        `Failed to download generated image (${imgRes.status})`,
        imgRes.status,
        'AI_IMAGE_DOWNLOAD_FAILED',
      );
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get('content-type')?.toLowerCase() ?? 'image/png';
    const mimeType: LlmImageResult['mimeType'] = contentType.includes('jpeg')
      ? 'image/jpeg'
      : contentType.includes('webp')
        ? 'image/webp'
        : 'image/png';
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
      revisedPrompt: item.revised_prompt,
    };
  }

  throw new LlmProviderError(
    'Image provider returned neither b64 nor URL.',
    res.status,
    'AI_EMPTY_RESPONSE',
  );
}

export function parseJsonResponse<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(body) as T;
}
