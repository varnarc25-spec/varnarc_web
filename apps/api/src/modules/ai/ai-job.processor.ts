import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import { llmChatCompletion, type LlmMessage } from './llm.client';

function interpolateTemplate(template: string, vars: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

@Injectable()
export class AiJobProcessor {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async run(jobId: string) {
    const job = await this.repos.aiJobs.findById(jobId);
    if (!job) throw new NotFoundException('AI job not found');

    await this.repos.aiJobs.update(jobId, { status: 'RUNNING', error: null });

    try {
      const input = (job.input ?? {}) as Record<string, unknown>;
      let messages: LlmMessage[];
      let useJson = false;

      if (job.prompt) {
        const vars = (input.variables ?? input) as Record<string, unknown>;
        const content = interpolateTemplate(job.prompt.template, vars);
        messages = [{ role: 'user', content }];
        useJson = Boolean(input.json ?? vars.json);
      } else if (Array.isArray(input.messages)) {
        messages = input.messages as LlmMessage[];
        useJson = Boolean(input.json);
      } else {
        messages = [{ role: 'user', content: String(input.text ?? input.prompt ?? '') }];
        useJson = Boolean(input.json);
      }

      const modelSlug =
        job.model?.slug ??
        job.prompt?.model?.slug ??
        (typeof input.model === 'string' ? input.model : undefined);

      const content = await llmChatCompletion(messages, {
        model: modelSlug,
        json: useJson,
        temperature: typeof input.temperature === 'number' ? input.temperature : undefined,
        maxTokens: typeof input.maxTokens === 'number' ? input.maxTokens : undefined,
      });

      const output = { content, model: modelSlug ?? null };
      await this.repos.aiJobs.update(jobId, {
        status: 'SUCCEEDED',
        output: output as never,
        error: null,
      });
      return this.repos.aiJobs.findById(jobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI job failed';
      await this.repos.aiJobs.update(jobId, {
        status: 'FAILED',
        error: message,
      });
      throw err;
    }
  }
}
