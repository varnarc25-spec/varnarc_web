import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { PrismaClient, Repositories } from '@varnarc/database';
import type {
  ConstructionCompareQuery,
  ConstructionEstimateInput,
  ConstructionListQuery,
  CreateConstructionBrandInput,
  CreateConstructionMaterialInput,
  CreateConstructionProjectInput,
  CreateCostTemplateInput,
  CreateConstructionComparisonInput,
  CreateConstructionChecklistInput,
  ConstructionEstimateSaveInput,
  UpdateConstructionBrandInput,
  UpdateConstructionMaterialInput,
  UpdateConstructionProjectInput,
  UpdateConstructionCategoryInput,
  UpdateConstructionChecklistInput,
  CreateConstructionCategoryInput,
  UpdateCostTemplateInput,
} from '@varnarc/validation';
import { PRISMA, REPOS } from '../../database/database.module';

const CACHE_TTL = 60_000;

const QUALITY_MULTIPLIER = { basic: 0.85, standard: 1, premium: 1.25 } as const;

const SUPPLIER_CATEGORY_SLUGS = [
  'building-materials',
  'cement-dealers',
  'steel-dealers',
  'contractors',
  'architects',
  'interior-designers',
] as const;

function slugifyTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'comparison'
  );
}

function minimalEstimatePdf(lines: string[]): Buffer {
  let y = 750;
  const contentStream = lines
    .map((line) => {
      const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      const cmd = `BT /F1 12 Tf 50 ${y} Td (${escaped}) Tj ET\n`;
      y -= 18;
      return cmd;
    })
    .join('');
  const header = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${contentStream.length} >>stream
${contentStream}endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000380 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
456
%%EOF`;
  return Buffer.from(header, 'utf8');
}

@Injectable()
export class ConstructionService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(PRISMA) private readonly db: PrismaClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private notFound(message = 'Construction resource not found.') {
    return new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message } });
  }

  private emptyUrl(v?: string | null) {
    return v === '' ? null : v;
  }

  private async audit(actorId: string, action: string, entity: string, entityId: string, newValue?: object) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity,
      entityId,
      newValue: newValue as never,
    });
  }

  private async bust() {
    await Promise.all([
      this.cache.del('construction:categories'),
      this.cache.del('construction:dashboard'),
      this.cache.del('construction:brands:published'),
    ]);
  }

  async dashboard() {
    const cached = await this.cache.get('construction:dashboard');
    if (cached) return cached;
    const [categories, materials, brands, templates, projects, faqs, guides] = await Promise.all([
      this.db.constructionCategory.count({ where: { deletedAt: null } }),
      this.db.constructionMaterial.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionBrand.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.costTemplate.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionProject.count({ where: { deletedAt: null } }),
      this.db.constructionFaq.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionGuide.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
    ]);
    const data = {
      categories,
      materialsPublished: materials,
      brandsPublished: brands,
      templatesPublished: templates,
      costTemplatesPublished: templates,
      projects,
      projectsCount: projects,
      faqs,
      guides,
      relatedCalculators: [
        { slug: 'construction-cost', name: 'Construction Cost Calculator' },
        { slug: 'paint', name: 'Paint Calculator' },
        { slug: 'cement', name: 'Cement Calculator' },
        { slug: 'concrete', name: 'Concrete Calculator' },
        { slug: 'brick', name: 'Brick Calculator' },
        { slug: 'steel', name: 'Steel Calculator' },
        { slug: 'tile', name: 'Tile Calculator' },
        { slug: 'flooring', name: 'Flooring Calculator' },
        { slug: 'sand', name: 'Sand Calculator' },
        { slug: 'aggregate', name: 'Aggregate Calculator' },
        { slug: 'plaster', name: 'Plaster Calculator' },
      ],
      supplierDirectory: { href: '/directory', label: 'Find suppliers & contractors' },
    };
    await this.cache.set('construction:dashboard', data, CACHE_TTL);
    return data;
  }

  async listCategories() {
    const cached = await this.cache.get('construction:categories');
    if (cached) return cached;
    const rows = await this.repos.constructionCategories.list();
    await this.cache.set('construction:categories', rows, CACHE_TTL);
    return rows;
  }

  async createCategory(input: CreateConstructionCategoryInput, actorId: string) {
    const clash = await this.repos.constructionCategories.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
    const row = await this.repos.constructionCategories.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
    });
    await this.audit(actorId, 'construction.category.create', 'construction_category', row.id, row);
    await this.bust();
    return row;
  }

  async updateCategory(id: string, input: UpdateConstructionCategoryInput, actorId: string) {
    const existing = await this.db.constructionCategory.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw this.notFound('Category not found.');
    const row = await this.repos.constructionCategories.update(id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    });
    await this.audit(actorId, 'construction.category.update', 'construction_category', id, row);
    await this.bust();
    return row;
  }

  async deleteCategory(id: string, actorId: string) {
    const ok = await this.repos.constructionCategories.softDelete(id);
    if (!ok) throw this.notFound('Category not found.');
    await this.audit(actorId, 'construction.category.delete', 'construction_category', id);
    await this.bust();
    return { id, deleted: true };
  }

  listMaterials(query: ConstructionListQuery) {
    return this.repos.constructionMaterials.list(query);
  }

  async getMaterial(id: string) {
    const row = await this.repos.constructionMaterials.findById(id);
    if (!row) throw this.notFound('Material not found.');
    return row;
  }

  async createMaterial(input: CreateConstructionMaterialInput, actorId: string) {
    const clash = await this.repos.constructionMaterials.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
    const row = await this.repos.constructionMaterials.create({
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.brandId ? { brand: { connect: { id: input.brandId } } } : {}),
      name: input.name,
      slug: input.slug,
      description: input.description,
      specifications: input.specifications as never,
      unit: input.unit,
      unitCost: input.unitCost,
      approximatePrice: input.approximatePrice ?? input.unitCost,
      availabilityRegion: input.availabilityRegion,
      affiliateUrl: this.emptyUrl(input.affiliateUrl),
      imageUrl: this.emptyUrl(input.imageUrl),
      featured: input.featured ?? false,
      sponsored: input.sponsored ?? false,
      status: input.status ?? 'DRAFT',
      rating: input.rating,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.material.create', 'construction_material', row.id, row);
    await this.bust();
    return row;
  }

  async updateMaterial(id: string, input: UpdateConstructionMaterialInput, actorId: string) {
    const existing = await this.repos.constructionMaterials.findById(id);
    if (!existing) throw this.notFound('Material not found.');
    const row = await this.repos.constructionMaterials.update(id, {
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(input.brandId !== undefined
        ? input.brandId
          ? { brand: { connect: { id: input.brandId } } }
          : { brand: { disconnect: true } }
        : {}),
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.specifications !== undefined ? { specifications: input.specifications as never } : {}),
      ...(input.unit != null ? { unit: input.unit } : {}),
      ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
      ...(input.approximatePrice !== undefined ? { approximatePrice: input.approximatePrice } : {}),
      ...(input.availabilityRegion !== undefined ? { availabilityRegion: input.availabilityRegion } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: this.emptyUrl(input.imageUrl) } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.sponsored != null ? { sponsored: input.sponsored } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
          }
        : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.material.update', 'construction_material', id, row);
    await this.bust();
    return row;
  }

  async publishMaterial(id: string, actorId: string) {
    return this.updateMaterial(id, { status: 'PUBLISHED' }, actorId);
  }

  async deleteMaterial(id: string, actorId: string) {
    const ok = await this.repos.constructionMaterials.softDelete(id, actorId);
    if (!ok) throw this.notFound('Material not found.');
    await this.audit(actorId, 'construction.material.delete', 'construction_material', id);
    await this.bust();
    return { id, deleted: true };
  }

  async duplicateMaterial(id: string, actorId: string) {
    const existing = await this.repos.constructionMaterials.findById(id);
    if (!existing) throw this.notFound('Material not found.');
    const baseSlug = `${existing.slug}-copy`;
    let slug = baseSlug;
    let n = 1;
    while (await this.repos.constructionMaterials.findBySlug(slug)) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const row = await this.repos.constructionMaterials.create({
      ...(existing.categoryId ? { category: { connect: { id: existing.categoryId } } } : {}),
      ...(existing.brandId ? { brand: { connect: { id: existing.brandId } } } : {}),
      name: `${existing.name} (copy)`,
      slug,
      description: existing.description,
      specifications: existing.specifications as never,
      unit: existing.unit,
      unitCost: existing.unitCost,
      approximatePrice: existing.approximatePrice,
      availabilityRegion: existing.availabilityRegion,
      affiliateUrl: existing.affiliateUrl,
      imageUrl: existing.imageUrl,
      featured: false,
      sponsored: false,
      status: 'DRAFT',
      rating: existing.rating,
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.material.duplicate', 'construction_material', row.id, row);
    await this.bust();
    return row;
  }

  listBrands(query: ConstructionListQuery) {
    return this.repos.constructionBrands.list(query);
  }

  async getBrand(id: string) {
    const row = await this.repos.constructionBrands.findById(id);
    if (!row) throw this.notFound('Brand not found.');
    return row;
  }

  async getBrandBySlug(slug: string) {
    const row = await this.repos.constructionBrands.findBySlug(slug);
    if (!row || row.status !== 'PUBLISHED') throw this.notFound('Brand not found.');
    return row;
  }

  async createBrand(input: CreateConstructionBrandInput, actorId: string) {
    const clash = await this.repos.constructionBrands.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
    const row = await this.repos.constructionBrands.create({
      name: input.name,
      slug: input.slug,
      logoUrl: this.emptyUrl(input.logoUrl),
      website: this.emptyUrl(input.website),
      description: input.description,
      featured: input.featured ?? false,
      status: input.status ?? 'DRAFT',
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.brand.create', 'construction_brand', row.id, row);
    await this.bust();
    return row;
  }

  async updateBrand(id: string, input: UpdateConstructionBrandInput, actorId: string) {
    const existing = await this.repos.constructionBrands.findById(id);
    if (!existing) throw this.notFound('Brand not found.');
    const row = await this.repos.constructionBrands.update(id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: this.emptyUrl(input.logoUrl) } : {}),
      ...(input.website !== undefined ? { website: this.emptyUrl(input.website) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.brand.update', 'construction_brand', id, row);
    await this.bust();
    return row;
  }

  async publishBrand(id: string, actorId: string) {
    return this.updateBrand(id, { status: 'PUBLISHED' }, actorId);
  }

  listTemplates(query: ConstructionListQuery) {
    return this.repos.costTemplates.list(query);
  }

  async createTemplate(input: CreateCostTemplateInput, actorId: string) {
    const clash = await this.repos.costTemplates.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
    const row = await this.repos.costTemplates.create({
      ...(input.categoryId ? { constructionCategory: { connect: { id: input.categoryId } } } : {}),
      name: input.name,
      slug: input.slug,
      description: input.description,
      category: input.category,
      formulaReference: input.formulaReference,
      items: input.items as never,
      laborPercent: input.laborPercent ?? 30,
      contingencyPercent: input.contingencyPercent ?? 10,
      status: input.status ?? 'DRAFT',
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.template.create', 'cost_template', row.id, row);
    await this.bust();
    return row;
  }

  async updateTemplate(id: string, input: UpdateCostTemplateInput, actorId: string) {
    const existing = await this.repos.costTemplates.findById(id);
    if (!existing) throw this.notFound('Template not found.');
    const row = await this.repos.costTemplates.update(id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.formulaReference !== undefined ? { formulaReference: input.formulaReference } : {}),
      ...(input.items !== undefined ? { items: input.items as never } : {}),
      ...(input.laborPercent !== undefined ? { laborPercent: input.laborPercent } : {}),
      ...(input.contingencyPercent !== undefined ? { contingencyPercent: input.contingencyPercent } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { constructionCategory: { connect: { id: input.categoryId } } }
          : { constructionCategory: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'construction.template.update', 'cost_template', id, row);
    await this.bust();
    return row;
  }

  async publishTemplate(id: string, actorId: string) {
    return this.updateTemplate(id, { status: 'PUBLISHED' }, actorId);
  }

  async estimate(input: ConstructionEstimateInput) {
    const slug = input.templateSlug || 'house-construction';
    let template = await this.repos.costTemplates.findBySlug(slug);
    if (!template || template.status !== 'PUBLISHED') {
      template = await this.db.costTemplate.findFirst({
        where: { deletedAt: null, status: 'PUBLISHED' },
        orderBy: { createdAt: 'asc' },
      });
    }
    const regionBoost =
      input.region && /mumbai|delhi|bangalore|bengaluru/i.test(input.region) ? 1.12 : 1;
    const laborPercent = Number(template?.laborPercent ?? 30);
    const contingencyPercent = Number(template?.contingencyPercent ?? 10);

    const roomRows: Array<{ label: string; amount: number; areaSqft: number }> = [];
    let materialCost = 0;

    if (input.rooms?.length) {
      for (const room of input.rooms) {
        const areaSqft =
          room.areaSqft ??
          (room.lengthFt && room.widthFt ? Math.round(room.lengthFt * room.widthFt * 100) / 100 : 0);
        if (areaSqft <= 0) continue;
        const quality = room.quality ?? input.quality;
        const roomMaterial = this.materialCostForArea(areaSqft, quality, regionBoost);
        materialCost += roomMaterial;
        roomRows.push({ label: room.name, amount: roomMaterial, areaSqft });
      }
    } else {
      const areaSqft = input.areaSqft ?? 0;
      materialCost = this.materialCostForArea(areaSqft, input.quality, regionBoost);
    }

    const lineItemRows: Array<{ label: string; amount: number }> = [];
    for (const item of input.lineItems ?? []) {
      const amount = Math.round(item.quantity * item.unitCost);
      lineItemRows.push({ label: item.name, amount });
      materialCost += amount;
    }

    const totalAreaSqft =
      roomRows.length > 0
        ? Math.round(roomRows.reduce((sum, row) => sum + row.areaSqft, 0) * 100) / 100
        : (input.areaSqft ?? 0);

    const laborCost = Math.round((materialCost * laborPercent) / 100);
    const equipmentCost = Math.round(materialCost * 0.08);
    const subtotal = materialCost + laborCost + equipmentCost;
    const contingency = Math.round((subtotal * contingencyPercent) / 100);
    const totalCost = subtotal + contingency;

    const breakdown: Array<{ label: string; amount: number }> = [];
    if (roomRows.length) {
      breakdown.push(...roomRows.map((row) => ({ label: `${row.label} (${row.areaSqft} sq ft)`, amount: row.amount })));
    }
    if (lineItemRows.length) {
      breakdown.push(...lineItemRows);
    }
    if (!roomRows.length && !lineItemRows.length) {
      breakdown.push({ label: 'Materials', amount: materialCost });
    } else if (roomRows.length || lineItemRows.length) {
      breakdown.push({ label: 'Materials subtotal', amount: materialCost });
    }
    breakdown.push(
      { label: 'Labor', amount: laborCost },
      { label: 'Equipment', amount: equipmentCost },
      { label: 'Contingency', amount: contingency },
      { label: 'Total', amount: totalCost },
    );

    return {
      templateSlug: template?.slug ?? slug,
      template: template ? { id: template.id, name: template.name, slug: template.slug } : null,
      areaSqft: totalAreaSqft,
      region: input.region ?? 'default',
      quality: input.quality,
      rooms: roomRows.length
        ? roomRows.map((row) => ({ name: row.label, areaSqft: row.areaSqft, materialCost: row.amount }))
        : undefined,
      lineItems: lineItemRows.length ? lineItemRows : undefined,
      materialCost,
      laborCost,
      equipmentCost,
      contingency,
      totalCost,
      breakdown,
      currency: 'INR',
      note: 'Estimate is indicative. Regional pricing and live feeds can plug into this endpoint later.',
    };
  }

  private materialCostForArea(
    areaSqft: number,
    quality: 'basic' | 'standard' | 'premium',
    regionBoost: number,
  ) {
    const basePerSqft =
      quality === 'premium' ? 2200 : quality === 'basic' ? 1400 : 1800;
    const multiplier = QUALITY_MULTIPLIER[quality] * regionBoost;
    return Math.round(areaSqft * basePerSqft * multiplier);
  }

  async saveEstimateAsProject(input: ConstructionEstimateSaveInput, userId?: string | null) {
    if (!userId) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required.' },
      });
    }
    const estimate = await this.estimate(input);
    return this.repos.constructionProjects.create({
      userId,
      name: input.name || `${input.quality} build · ${input.areaSqft} sqft`,
      projectType: input.templateSlug || 'house-construction',
      areaSqft: input.areaSqft,
      region: input.region,
      estimatedCost: estimate.totalCost,
      breakdown: estimate as never,
      notes: `Saved from estimator (${input.quality}, ${input.region || 'default region'})`,
      items: { create: [] },
    });
  }

  async updateProject(
    id: string,
    input: UpdateConstructionProjectInput,
    userId?: string | null,
    admin = false,
  ) {
    const existing = await this.repos.constructionProjects.findById(
      id,
      admin ? undefined : userId || undefined,
    );
    if (!existing) throw this.notFound('Project not found.');
    return this.repos.constructionProjects.update(id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.projectType != null ? { projectType: input.projectType } : {}),
      ...(input.areaSqft !== undefined ? { areaSqft: input.areaSqft } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
  }

  compare(query: ConstructionCompareQuery) {
    return this.repos.constructionMaterials.findManyByIds(query.ids);
  }

  async listProjects(userId?: string | null, admin = false) {
    if (admin) return this.repos.constructionProjects.listAdmin({ limit: 50 });
    if (!userId) throw new UnauthorizedException({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required.' } });
    return this.repos.constructionProjects.listForUser(userId);
  }

  async createProject(input: CreateConstructionProjectInput, userId?: string | null) {
    if (!userId) throw new UnauthorizedException({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required.' } });
    const items = input.items.map((item) => {
      const unitCost = item.unitCost ?? 0;
      const estimatedCost = unitCost * item.quantity;
      return {
        materialId: item.materialId,
        name: item.name,
        quantity: item.quantity,
        unitCost,
        estimatedCost,
      };
    });
    const estimatedCost = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    const row = await this.repos.constructionProjects.create({
      userId,
      name: input.name,
      projectType: input.projectType,
      areaSqft: input.areaSqft,
      region: input.region,
      notes: input.notes,
      estimatedCost,
      items: {
        create: items.map((i) => ({
          ...(i.materialId ? { material: { connect: { id: i.materialId } } } : {}),
          name: i.name,
          quantity: i.quantity,
          unitCost: i.unitCost,
          estimatedCost: i.estimatedCost,
        })),
      },
    });
    return row;
  }

  async deleteProject(id: string, userId?: string | null, admin = false) {
    const row = await this.repos.constructionProjects.findById(id, admin ? undefined : userId || undefined);
    if (!row) throw this.notFound('Project not found.');
    await this.repos.constructionProjects.softDelete(id);
    return { id, deleted: true };
  }

  listFaqs(admin = false) {
    return this.db.constructionFaq.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  createFaq(input: { question: string; answer: string; sortOrder?: number }, actorId: string) {
    return this.db.constructionFaq.create({
      data: {
        question: input.question,
        answer: input.answer,
        sortOrder: input.sortOrder ?? 0,
        status: 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  listGuides(admin = false) {
    return this.db.constructionGuide.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getGuide(slug: string) {
    const row = await this.db.constructionGuide.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
    });
    if (!row) throw this.notFound('Guide not found.');
    return { ...row, content: row.body };
  }

  createGuide(
    input: { title: string; slug: string; summary?: string | null; body?: string | null },
    actorId: string,
  ) {
    return this.db.constructionGuide.create({
      data: {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        body: input.body,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async listChecklists(admin = false) {
    const rows = await this.db.constructionChecklist.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: [{ projectType: 'asc' }, { title: 'asc' }],
    });
    return rows.map((row) => {
      const items = Array.isArray(row.items) ? row.items : [];
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        phase: row.projectType,
        projectType: row.projectType,
        status: row.status,
        itemCount: items.length,
        items: admin ? items : undefined,
      };
    });
  }

  async getChecklist(slug: string) {
    const row = await this.db.constructionChecklist.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
    });
    if (!row) throw this.notFound('Checklist not found.');
    const rawItems: unknown[] = Array.isArray(row.items) ? row.items : [];
    const items = rawItems.map((item: unknown, index: number) => {
      if (typeof item === 'string') {
        return { label: item, sortOrder: index + 1 };
      }
      const rowItem = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        id: typeof rowItem.id === 'string' ? rowItem.id : undefined,
        label: String(rowItem.label ?? rowItem.title ?? `Item ${index + 1}`),
        description: rowItem.description != null ? String(rowItem.description) : null,
        phase: rowItem.phase != null ? String(rowItem.phase) : row.projectType,
        sortOrder: typeof rowItem.sortOrder === 'number' ? rowItem.sortOrder : index + 1,
      };
    });
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      items,
    };
  }

  async createChecklist(input: CreateConstructionChecklistInput, actorId: string) {
    const baseSlug = input.slug ?? slugifyTitle(input.title);
    let slug = baseSlug;
    let n = 1;
    while (await this.db.constructionChecklist.findFirst({ where: { slug, deletedAt: null } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const row = await this.db.constructionChecklist.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        projectType: input.projectType,
        items: input.items,
        status: input.status ?? 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await this.audit(actorId, 'construction.checklist.create', 'construction_checklist', row.id, row);
    return row;
  }

  async updateChecklist(id: string, input: UpdateConstructionChecklistInput, actorId: string) {
    const existing = await this.db.constructionChecklist.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw this.notFound('Checklist not found.');
    const row = await this.db.constructionChecklist.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.slug != null ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.projectType !== undefined ? { projectType: input.projectType } : {}),
        ...(input.items !== undefined ? { items: input.items } : {}),
        ...(input.status != null ? { status: input.status } : {}),
        updatedBy: actorId,
      },
    });
    await this.audit(actorId, 'construction.checklist.update', 'construction_checklist', id, row);
    return row;
  }

  async deleteChecklist(id: string, actorId: string) {
    const existing = await this.db.constructionChecklist.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw this.notFound('Checklist not found.');
    await this.db.constructionChecklist.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorId },
    });
    await this.audit(actorId, 'construction.checklist.delete', 'construction_checklist', id);
    return { id, deleted: true };
  }

  async entityHistory(entity: string, entityId: string) {
    const allowed = new Set([
      'construction_material',
      'construction_brand',
      'cost_template',
      'construction_category',
      'construction_checklist',
      'construction_comparison',
      'construction_faq',
      'construction_guide',
    ]);
    if (!allowed.has(entity)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Unknown construction entity for history.' },
      });
    }
    const rows = await this.db.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      createdAt: row.createdAt,
      user: row.user
        ? { id: row.user.id, email: row.user.email, displayName: row.user.displayName }
        : null,
      newValue: row.newValue,
    }));
  }

  async listComparisons() {
    const rows = await this.db.constructionComparison.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => {
      const ids = Array.isArray(row.entityIds) ? (row.entityIds as string[]) : [];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        type: row.entityType,
        entityType: row.entityType,
        ids,
        materialIds: ids,
        status: row.status,
        createdAt: row.createdAt,
      };
    });
  }

  async createComparison(input: CreateConstructionComparisonInput, actorId: string) {
    const entityIds = input.entityIds ?? input.ids ?? [];
    const entityType = input.entityType ?? input.type ?? 'materials';
    const baseSlug = input.slug ?? slugifyTitle(input.title);
    let slug = baseSlug;
    let n = 1;
    while (await this.db.constructionComparison.findFirst({ where: { slug, deletedAt: null } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const row = await this.db.constructionComparison.create({
      data: {
        title: input.title,
        slug,
        entityType,
        entityIds,
        status: input.status ?? 'PUBLISHED',
        publishedAt: (input.status ?? 'PUBLISHED') === 'PUBLISHED' ? new Date() : null,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await this.audit(actorId, 'construction.comparison.create', 'construction_comparison', row.id, row);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: row.entityType,
      entityType: row.entityType,
      ids: entityIds,
      materialIds: entityIds,
      status: row.status,
    };
  }

  async adminReportsSummary() {
    const [
      categories,
      materialsPublished,
      brandsPublished,
      costTemplatesPublished,
      projectsCount,
      guidesPublished,
      faqsPublished,
      comparisonsCount,
      supplierCategories,
    ] = await Promise.all([
      this.db.constructionCategory.count({ where: { deletedAt: null } }),
      this.db.constructionMaterial.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionBrand.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.costTemplate.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionProject.count({ where: { deletedAt: null } }),
      this.db.constructionGuide.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionFaq.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.constructionComparison.count({ where: { deletedAt: null } }),
      this.db.businessCategory.findMany({
        where: { slug: { in: [...SUPPLIER_CATEGORY_SLUGS] }, deletedAt: null },
        select: { id: true },
      }),
    ]);
    const suppliersLinked = supplierCategories.length
      ? await this.db.business.count({
          where: {
            deletedAt: null,
            status: 'APPROVED',
            categories: { some: { categoryId: { in: supplierCategories.map((c) => c.id) } } },
          },
        })
      : 0;
    return {
      categories,
      materialsPublished,
      brandsPublished,
      costTemplatesPublished,
      projectsCount,
      guidesPublished,
      faqsPublished,
      comparisonsCount,
      suppliersLinked,
    };
  }

  async estimateReport(input: ConstructionEstimateInput) {
    const estimate = await this.estimate(input);
    return {
      generatedAt: new Date().toISOString(),
      ...estimate,
    };
  }

  async estimateReportPdf(input: ConstructionEstimateInput) {
    const estimate = await this.estimate(input);
    const lines = [
      'Varnarc Construction Estimate',
      `Area: ${estimate.areaSqft} sq ft`,
      `Quality: ${estimate.quality}`,
      `Region: ${estimate.region}`,
      `Materials: INR ${estimate.materialCost}`,
      `Labor: INR ${estimate.laborCost}`,
      `Equipment: INR ${estimate.equipmentCost}`,
      `Contingency: INR ${estimate.contingency}`,
      `Total: INR ${estimate.totalCost}`,
      estimate.note ?? '',
    ];
    return minimalEstimatePdf(lines);
  }

  async suppliers(params: { limit?: number; cursor?: string } = {}) {
    const limit = Math.min(Math.max(params.limit ?? 100, 1), 200);
    const categories = await this.db.businessCategory.findMany({
      where: { slug: { in: [...SUPPLIER_CATEGORY_SLUGS] }, deletedAt: null },
    });
    const categoryIds = categories.map((c) => c.id);
    const businesses = categoryIds.length
      ? await this.db.business.findMany({
          where: {
            deletedAt: null,
            status: 'APPROVED',
            categories: { some: { categoryId: { in: categoryIds } } },
          },
          include: {
            locations: { where: { deletedAt: null }, take: 1 },
            categories: { include: { category: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit + 1,
          ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
        })
      : [];
    const hasMore = businesses.length > limit;
    const page = hasMore ? businesses.slice(0, limit) : businesses;
    const mapped = page.map((b) => {
      const meta = (b.metadata ?? {}) as Record<string, unknown>;
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        city: b.locations[0]?.city ?? null,
        phone: b.phone,
        description: b.description,
        sponsored: Boolean(meta.sponsored),
        category: b.categories[0]?.category.name ?? null,
      };
    });
    return {
      businesses: mapped,
      categories: categories.map((c) => ({
        name: c.name,
        href: `/directory?category=${c.slug}`,
      })),
      directoryHref: '/directory?vertical=construction',
      meta: {
        hasMore,
        nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
        limit,
      },
    };
  }

  async exportCsv(entity: string) {
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    if (entity === 'materials') {
      const rows = await this.db.constructionMaterial.findMany({
        where: { deletedAt: null },
        include: { category: { select: { slug: true } }, brand: { select: { slug: true } } },
      });
      return [
        'id,name,slug,unit,unitCost,status,affiliateUrl,categorySlug,brandSlug',
        ...rows.map((r) =>
          [
            r.id,
            r.name,
            r.slug,
            r.unit,
            r.unitCost,
            r.status,
            r.affiliateUrl,
            r.category?.slug ?? '',
            r.brand?.slug ?? '',
          ]
            .map(esc)
            .join(','),
        ),
      ].join('\n');
    }
    if (entity === 'brands') {
      const rows = await this.db.constructionBrand.findMany({ where: { deletedAt: null } });
      return ['id,name,slug,website,status,featured', ...rows.map((r) => [r.id, r.name, r.slug, r.website, r.status, r.featured].map(esc).join(','))].join('\n');
    }
    if (entity === 'cost-templates') {
      const rows = await this.db.costTemplate.findMany({ where: { deletedAt: null } });
      return ['id,name,slug,category,status', ...rows.map((r) => [r.id, r.name, r.slug, r.category, r.status].map(esc).join(','))].join('\n');
    }
    if (entity === 'projects') {
      const rows = await this.db.constructionProject.findMany({ where: { deletedAt: null } });
      return [
        'id,name,projectType,areaSqft,region,estimatedCost',
        ...rows.map((r) =>
          [r.id, r.name, r.projectType, r.areaSqft, r.region, r.estimatedCost].map(esc).join(','),
        ),
      ].join('\n');
    }
    throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Unknown entity.' } });
  }

  async importCsv(entity: string, csvText: string, actorId: string) {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Empty CSV.' } });
    const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cols[i] ?? '';
      });
      return row;
    });
    let imported = 0;
    if (entity === 'brands') {
      for (const row of rows) {
        if (!row.name || !row.slug) continue;
        await this.db.constructionBrand.upsert({
          where: { slug: row.slug },
          update: { name: row.name, website: row.website || null, status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT', updatedBy: actorId },
          create: { name: row.name, slug: row.slug, website: row.website || null, status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT', createdBy: actorId, updatedBy: actorId },
        });
        imported += 1;
      }
    } else if (entity === 'materials') {
      for (const row of rows) {
        if (!row.name || !row.slug || !row.unit) continue;
        const categoryId = row.categorySlug
          ? (
              await this.db.constructionCategory.findFirst({
                where: { slug: row.categorySlug, deletedAt: null },
                select: { id: true },
              })
            )?.id ?? null
          : row.categoryId || null;
        const brandId = row.brandSlug
          ? (
              await this.db.constructionBrand.findFirst({
                where: { slug: row.brandSlug, deletedAt: null },
                select: { id: true },
              })
            )?.id ?? null
          : row.brandId || null;
        await this.db.constructionMaterial.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            unit: row.unit,
            unitCost: row.unitCost ? Number(row.unitCost) : null,
            categoryId,
            brandId,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            unit: row.unit,
            unitCost: row.unitCost ? Number(row.unitCost) : null,
            categoryId,
            brandId,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else {
      throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: `Import for ${entity} not supported yet.` } });
    }
    await this.bust();
    return { imported };
  }
}
