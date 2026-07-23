import type { PrismaClient } from '@prisma/client';

const DEFAULT_TEMPLATE = {
  slug: 'weekly-digest',
  name: 'Weekly digest',
  subject: 'Your Varnarc weekly digest',
  bodyHtml: `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; color: #0f172a; line-height: 1.6;">
    <h1 style="font-size: 20px;">Varnarc weekly digest</h1>
    <p>Hi there,</p>
    <p>Here is your latest roundup of calculators, guides, and tools from Varnarc.</p>
    <p>
      <a href="{{siteUrl}}/calculators" style="color: #0b3d5c;">Explore calculators</a>
      ·
      <a href="{{siteUrl}}/articles" style="color: #0b3d5c;">Read articles</a>
    </p>
    <p style="font-size: 12px; color: #64748b; margin-top: 32px;">
      You are receiving this because you subscribed at {{siteUrl}}.
      <a href="{{unsubscribeUrl}}">Unsubscribe</a>
    </p>
  </body>
</html>`,
};

export async function seedNewsletter(prisma: PrismaClient) {
  await prisma.newsletterTemplate.upsert({
    where: { slug: DEFAULT_TEMPLATE.slug },
    update: {
      name: DEFAULT_TEMPLATE.name,
      subject: DEFAULT_TEMPLATE.subject,
      bodyHtml: DEFAULT_TEMPLATE.bodyHtml,
      deletedAt: null,
    },
    create: DEFAULT_TEMPLATE,
  });
}
