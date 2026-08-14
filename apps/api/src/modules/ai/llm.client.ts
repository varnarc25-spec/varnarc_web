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
    imageModel: process.env.AI_IMAGE_MODEL?.trim() || 'gpt-image-1',
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
  options: {
    size?: '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792';
    model?: string;
  } = {},
): Promise<LlmImageResult> {
  const { apiKey, baseUrl } = resolveConfig();
  if (!apiKey) {
    throw new ServiceUnavailableException({
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message:
          'AI is not configured. Set OPENAI_API_KEY in the API environment to generate images.',
      },
    });
  }

  const model = options.model?.trim() || process.env.AI_IMAGE_MODEL?.trim() || 'gpt-image-1';
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
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new ServiceUnavailableException({
      success: false,
      error: {
        code: 'AI_IMAGE_PROVIDER_ERROR',
        message: json.error?.message || `Image generation failed (${res.status})`,
      },
    });
  }

  const item = json.data?.[0];
  if (!item) {
    throw new ServiceUnavailableException({
      success: false,
      error: { code: 'AI_EMPTY_RESPONSE', message: 'Image provider returned no image data.' },
    });
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
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'AI_IMAGE_DOWNLOAD_FAILED',
          message: `Failed to download generated image (${imgRes.status})`,
        },
      });
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

  throw new ServiceUnavailableException({
    success: false,
    error: { code: 'AI_EMPTY_RESPONSE', message: 'Image provider returned neither b64 nor URL.' },
  });
}

export function parseJsonResponse<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(body) as T;
}
