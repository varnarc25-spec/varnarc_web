import type { PrismaClient } from '@prisma/client';

export async function seedAiOps(prisma: PrismaClient) {
  const models = [
    {
      slug: 'gemini-flash-latest',
      name: 'Gemini Flash (latest)',
      provider: 'google',
      metadata: { description: 'Default fast model via OpenAI-compatible API' },
    },
    {
      slug: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      metadata: { description: 'OpenAI economical model' },
    },
  ];

  for (const model of models) {
    await prisma.aiModel.upsert({
      where: { slug: model.slug },
      update: { name: model.name, provider: model.provider, metadata: model.metadata, deletedAt: null },
      create: model,
    });
  }

  const defaultModel = await prisma.aiModel.findUniqueOrThrow({ where: { slug: 'gemini-flash-latest' } });

  const prompts = [
    {
      slug: 'article.generate-draft',
      name: 'Article — Generate draft',
      template:
        'Write an SEO article for Varnarc India.\nTopic: {{topic}}\nVertical: {{vertical}}\nTone: {{tone}}\nAudience: {{audience}}\nReturn JSON with title, slug, excerpt, content (markdown), seo, suggestedRelatedTopics.',
      variables: ['topic', 'vertical', 'tone', 'audience'],
    },
    {
      slug: 'article.improve',
      name: 'Article — Improve content',
      template:
        'Improve this article (mode: {{mode}}).\nTitle: {{title}}\n\n{{content}}\n\nReturn JSON per mode instructions.',
      variables: ['mode', 'title', 'content'],
    },
    {
      slug: 'article.suggest-related',
      name: 'Article — Suggest related topics',
      template:
        'Suggest related article topics for internal linking.\nTitle: {{title}}\nExcerpt: {{excerpt}}\nReturn JSON: { topics: string[] }',
      variables: ['title', 'excerpt'],
    },
    {
      slug: 'content.summarize',
      name: 'Content — Summarize',
      template: 'Summarize the following text in 2-3 sentences:\n\n{{text}}',
      variables: ['text'],
    },
    {
      slug: 'seo.meta',
      name: 'SEO — Meta description',
      template:
        'Write SEO metadata for Varnarc India.\nEntity: {{entityType}}\nTitle: {{title}}\nExcerpt: {{excerpt}}\nPath: {{path}}',
      variables: ['entityType', 'title', 'excerpt', 'path'],
    },
    {
      slug: 'calculator.assist',
      name: 'Calculator — Explain results',
      template:
        'Explain calculator results for an Indian audience.\nCalculator: {{calculatorName}}\nInputs: {{inputs}}\nOutputs: {{outputs}}\nQuestion: {{question}}',
      variables: ['calculatorName', 'inputs', 'outputs', 'question'],
    },
  ];

  for (const prompt of prompts) {
    await prisma.aiPrompt.upsert({
      where: { slug: prompt.slug },
      update: {
        name: prompt.name,
        template: prompt.template,
        variables: prompt.variables,
        modelId: defaultModel.id,
        deletedAt: null,
      },
      create: {
        slug: prompt.slug,
        name: prompt.name,
        template: prompt.template,
        variables: prompt.variables,
        modelId: defaultModel.id,
      },
    });
  }
}
