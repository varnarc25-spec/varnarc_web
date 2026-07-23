import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  AiJobListQuery,
  CreateAiJobInput,
  CreateAiModelInput,
  CreateAiPromptInput,
  CursorPaginationQuery,
  RunAiPromptTestInput,
  UpdateAiModelInput,
  UpdateAiPromptInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { getLlmConfig } from './llm.client';
import { AiJobProcessor } from './ai-job.processor';

@Injectable()
export class AiService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly processor: AiJobProcessor,
  ) {}

  getOverview() {
    return Promise.all([
      getLlmConfig(),
      this.repos.aiJobs.getStats(),
      this.repos.aiPrompts.countActive(),
      this.repos.aiModels.countActive(),
    ]).then(([config, jobs, promptCount, modelCount]) => ({
      ...config,
      articleAi: { configured: config.configured },
      jobs,
      promptCount,
      modelCount,
    }));
  }

  getSettings() {
    const config = getLlmConfig();
    return {
      ...config,
      hasApiKey: config.configured,
      envVars: ['OPENAI_API_KEY', 'AI_BASE_URL', 'AI_DEFAULT_MODEL', 'AI_DAILY_JOB_LIMIT'],
    };
  }

  getUsage() {
    return this.repos.aiJobs.getStats();
  }

  listModels(query: CursorPaginationQuery) {
    return this.repos.aiModels.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  createModel(input: CreateAiModelInput) {
    return this.repos.aiModels.create({
      slug: input.slug,
      name: input.name,
      provider: input.provider,
      metadata: input.metadata as never,
    });
  }

  async updateModel(id: string, input: UpdateAiModelInput) {
    const row = await this.repos.aiModels.findById(id);
    if (!row) throw new NotFoundException('AI model not found');
    return this.repos.aiModels.update(id, {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
    });
  }

  async deleteModel(id: string) {
    const row = await this.repos.aiModels.findById(id);
    if (!row) throw new NotFoundException('AI model not found');
    await this.repos.aiModels.softDelete(id);
    return { ok: true };
  }

  listPrompts(query: CursorPaginationQuery) {
    return this.repos.aiPrompts.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  createPrompt(input: CreateAiPromptInput, actorId: string) {
    return this.repos.aiPrompts.create({
      slug: input.slug,
      name: input.name,
      template: input.template,
      variables: input.variables as never,
      ...(input.modelId ? { model: { connect: { id: input.modelId } } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async updatePrompt(id: string, input: UpdateAiPromptInput, actorId: string) {
    const row = await this.repos.aiPrompts.findById(id);
    if (!row) throw new NotFoundException('AI prompt not found');
    return this.repos.aiPrompts.update(id, {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.template !== undefined ? { template: input.template } : {}),
      ...(input.variables !== undefined ? { variables: input.variables as never } : {}),
      ...(input.modelId !== undefined
        ? input.modelId
          ? { model: { connect: { id: input.modelId } } }
          : { model: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
  }

  async deletePrompt(id: string, actorId: string) {
    const row = await this.repos.aiPrompts.findById(id);
    if (!row) throw new NotFoundException('AI prompt not found');
    await this.repos.aiPrompts.softDelete(id, actorId);
    return { ok: true };
  }

  listJobs(query: AiJobListQuery) {
    return this.repos.aiJobs.list({
      cursor: query.cursor,
      limit: query.limit,
      userId: query.userId,
      status: query.status,
    });
  }

  async createJob(input: CreateAiJobInput, userId: string) {
    let promptId = input.promptId ?? null;
    if (!promptId && input.promptSlug) {
      const prompt = await this.repos.aiPrompts.findBySlug(input.promptSlug);
      if (!prompt) throw new BadRequestException(`Prompt not found: ${input.promptSlug}`);
      promptId = prompt.id;
    }

    const job = await this.repos.aiJobs.create({
      input: input.input as never,
      status: 'QUEUED',
      user: { connect: { id: userId } },
      ...(promptId ? { prompt: { connect: { id: promptId } } } : {}),
      ...(input.modelId ? { model: { connect: { id: input.modelId } } } : {}),
    });

    if (input.runImmediately !== false) {
      return this.processor.run(job.id);
    }
    return job;
  }

  async retryJob(jobId: string) {
    const job = await this.repos.aiJobs.findById(jobId);
    if (!job) throw new NotFoundException('AI job not found');
    await this.repos.aiJobs.update(jobId, { status: 'QUEUED', error: null });
    return this.processor.run(jobId);
  }

  async runPromptTest(input: RunAiPromptTestInput, userId: string) {
    return this.createJob(
      {
        promptId: input.promptId,
        promptSlug: input.promptSlug,
        modelId: input.modelId,
        input: { variables: input.variables ?? {}, json: false },
        runImmediately: true,
      },
      userId,
    );
  }

  async logFeatureJob(
    userId: string | null,
    feature: string,
    input: unknown,
    output: unknown,
    error?: string | null,
  ) {
    return this.repos.aiJobs.create({
      status: error ? 'FAILED' : 'SUCCEEDED',
      input: { feature, payload: input } as never,
      output: output as never,
      error: error ?? null,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
    });
  }
}
