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
import {
  computeBoqLineAmount,
  sanitizeDocumentFilename,
  saveConstructionDocumentMetaSchema,
  type ConstructionCompareQuery,
  type ConstructionEstimateInput,
  type ConstructionListQuery,
  type CreateConstructionBrandInput,
  type CreateConstructionMaterialInput,
  type CreateConstructionProjectInput,
  type CreateCostTemplateInput,
  type CreateConstructionComparisonInput,
  type CreateConstructionChecklistInput,
  type ConstructionEstimateSaveInput,
  type UpdateConstructionBrandInput,
  type UpdateConstructionMaterialInput,
  type UpdateConstructionProjectInput,
  type UpdateConstructionCategoryInput,
  type UpdateConstructionChecklistInput,
  type CreateConstructionCategoryInput,
  type UpdateCostTemplateInput,
  type SaveConstructionProjectBoqInput,
  type ReplaceConstructionProjectPhasesInput,
  type SaveConstructionBudgetItemInput,
  type SaveConstructionExpenseInput,
  type SaveConstructionDocumentMetaInput,
  encodeExpenseNotes,
  PRICE_HUB_CITIES,
  PRICE_HUB_MATERIALS,
  PRICE_SOURCE_CATEGORY_LABELS,
  PRICE_HISTORY_CHANGE_PERIODS,
  FAIR_PRICE_CHECKER_QUALIFICATION,
  FAIR_PRICE_METHODOLOGY,
  FAIR_PRICE_UNITS,
  FAIR_PRICE_CHECKER_VERSION,
  VCCI_BASELINE,
  VCCI_COMPONENTS,
  VCCI_METHODOLOGY_SECTIONS,
  VCCI_METHODOLOGY_VERSION,
  VCCI_NAME,
  VCCI_QUALIFICATION,
  VCCI_SHORT_NAME,
  assessVcciSnapshotQuality,
  canIndexPriceLanding,
  buildPriceLandingSeoContent,
  buildPersistedCalculationPayload,
  recalculateSavedConstructionCalculation,
  canPublishVcciPublicly,
  buildConstructionCostCityLanding,
  canIndexConstructionCostCity,
  getConstructionCostCityProfile,
  listConstructionCostCityProfileSlugs,
  listPotentialConstructionCostCities,
  isConstructionCostCitySlug,
  computePricePeriodChanges,
  defaultVcciWeights,
  evaluateFairPriceCheck,
  fairPriceCheckInputSchema,
  getFairPriceCityOptions,
  getFairPriceMaterialOptions,
  getPriceHubCity,
  getPriceHubMaterial,
  getVcciComponent,
  isPriceHubCitySlug,
  isPriceHubMaterialKey,
  isVcciComponentKey,
  matchMaterialToHubKey,
  normalizePriceSourceCategory,
  resolveDisplayFreshness,
  shouldShowPriceHistoryChart,
  shouldShowVcciHistoryChart,
  type FairPriceCheckInput,
  SUPPLIER_DIRECTORY_CATEGORIES,
  SUPPLIER_DIRECTORY_CITIES,
  SUPPLIER_DIRECTORY_QUALIFICATION,
  SUPPLIER_DIRECTORY_SLUGS,
  SUPPLIER_DIRECTORY_VERSION,
  SUPPLIER_DEFAULT_SORT,
  SUPPLIER_SORT_OPTIONS,
  canIndexSupplierLanding,
  directorySlugsForCategory,
  formatBusinessHours,
  getSupplierDirectoryCategory,
  inferSupplierCategoriesFromDirectorySlugs,
  isSupplierDirectoryCategoryKey,
  supplierDirectoryQuerySchema,
  supplierLandingPath,
  supplierProfilePath,
  verificationDisplay,
  type SupplierDirectoryQuery,
  PROFESSIONAL_TYPES,
  PROFESSIONAL_SPECIALITIES,
  PROFESSIONAL_PROJECT_TYPES,
  PROFESSIONALS_DIRECTORY_CITIES,
  PROFESSIONALS_DIRECTORY_QUALIFICATION,
  PROFESSIONALS_DIRECTORY_VERSION,
  PROFESSIONAL_SORT_OPTIONS,
  PROFESSIONAL_DEFAULT_SORT,
  PROFESSIONAL_INFO_SOURCES,
  PROFESSIONAL_DIRECTORY_SLUGS,
  canIndexProfessionalLanding,
  directorySlugsForProfessionalType,
  getProfessionalType,
  inferProfessionalTypesFromDirectorySlugs,
  isProfessionalTypeKey,
  listingSourceBadges,
  parseProfessionalMetadata,
  professionalLandingPath,
  professionalProfilePath,
  professionalsDirectoryQuerySchema,
  type ProfessionalsDirectoryQuery,
  evaluateProjectReadiness as scoreProjectReadiness,
  getProjectReadinessMeta,
  projectReadinessInputSchema,
  type ProjectReadinessInput,
  CANONICAL_CONSTRUCTION_CHECKLISTS,
  CONSTRUCTION_CHECKLIST_QUALIFICATION,
  CONSTRUCTION_CHECKLIST_PROFESSIONAL_REVIEW_NOTE,
  getCanonicalChecklist,
  getConstructionChecklistMeta,
  normalizeChecklistItems,
  saveConstructionChecklistProgressSchema,
  summarizeChecklistProgress,
  type SaveConstructionChecklistProgressInput,
} from '@varnarc/validation';

import { PRISMA, REPOS } from '../../database/database.module';
import { GcsStorageService } from '../media/gcs-storage.service';

const CACHE_TTL = 60_000;

const QUALITY_MULTIPLIER = { basic: 0.85, standard: 1, premium: 1.25 } as const;

function slugifyTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'comparison'
  );
}

function minimalEstimatePdf(lines: string[]): Buffer {
  const pageHeight = 792;
  const top = 750;
  const bottom = 48;
  const lineHeight = 14;
  const fontSize = 11;
  const left = 48;
  const maxChars = 92;

  const wrapped: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\r/g, '');
    if (!line) {
      wrapped.push('');
      continue;
    }
    let remaining = line;
    while (remaining.length > maxChars) {
      let cut = remaining.lastIndexOf(' ', maxChars);
      if (cut < 40) cut = maxChars;
      wrapped.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut).trimStart();
    }
    wrapped.push(remaining);
  }

  const pages: string[][] = [];
  let current: string[] = [];
  let y = top;
  for (const line of wrapped) {
    if (y < bottom) {
      pages.push(current);
      current = [];
      y = top;
    }
    current.push(line);
    y -= lineHeight;
  }
  if (current.length) pages.push(current);
  if (!pages.length) pages.push(['Varnarc Construction Report']);

  return buildMultiPageHelveticalPdf(pages, {
    pageHeight,
    top,
    lineHeight,
    fontSize,
    left,
  });
}

function buildMultiPageHelveticalPdf(
  pages: string[][],
  opts: {
    pageHeight: number;
    top: number;
    lineHeight: number;
    fontSize: number;
    left: number;
  },
): Buffer {
  const escapePdf = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  type Obj = { id: number; body: string };
  const objects: Obj[] = [];
  const add = (body: string) => {
    const id = objects.length + 1;
    objects.push({ id, body });
    return id;
  };

  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds: number[] = [];

  for (const pageLines of pages) {
    let y = opts.top;
    const stream = pageLines
      .map((line) => {
        const cmd = `BT /F1 ${opts.fontSize} Tf ${opts.left} ${y} Td (${escapePdf(line)}) Tj ET\n`;
        y -= opts.lineHeight;
        return cmd;
      })
      .join('');
    const contentId = add(
      `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>stream\n${stream}endstream`,
    );
    const pageId = add(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 ${opts.pageHeight}] /Contents ${contentId} 0 R /Resources<< /Font<< /F1 ${fontId} 0 R >> >> >>`,
    );
    pageIds.push(pageId);
  }

  const pagesId = add(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`,
  );
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  for (const pageId of pageIds) {
    const obj = objects[pageId - 1]!;
    obj.body = obj.body.replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`);
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets[obj.id] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${obj.id} 0 obj${obj.body}endobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

@Injectable()
export class ConstructionService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(PRISMA) private readonly db: PrismaClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly storage: GcsStorageService,
  ) {}

  private notFound(message = 'Construction resource not found.') {
    return new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message } });
  }

  private emptyUrl(v?: string | null) {
    return v === '' ? null : v;
  }

  private async audit(
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    newValue?: object,
  ) {
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
      supplierDirectory: { href: '/construction/suppliers', label: 'Find suppliers' },
      professionalsDirectory: {
        href: '/construction/professionals',
        label: 'Find professionals',
      },
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
    if (clash)
      throw new ConflictException({
        success: false,
        error: { code: 'CONFLICT', message: 'Slug exists.' },
      });
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
    const existing = await this.db.constructionCategory.findFirst({
      where: { id, deletedAt: null },
    });
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
    if (clash)
      throw new ConflictException({
        success: false,
        error: { code: 'CONFLICT', message: 'Slug exists.' },
      });
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
      ...(input.specifications !== undefined
        ? { specifications: input.specifications as never }
        : {}),
      ...(input.unit != null ? { unit: input.unit } : {}),
      ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
      ...(input.approximatePrice !== undefined ? { approximatePrice: input.approximatePrice } : {}),
      ...(input.availabilityRegion !== undefined
        ? { availabilityRegion: input.availabilityRegion }
        : {}),
      ...(input.affiliateUrl !== undefined
        ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) }
        : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: this.emptyUrl(input.imageUrl) } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.sponsored != null ? { sponsored: input.sponsored } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt:
              input.status === 'PUBLISHED'
                ? (existing.publishedAt ?? new Date())
                : existing.publishedAt,
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
    await this.audit(
      actorId,
      'construction.material.duplicate',
      'construction_material',
      row.id,
      row,
    );
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
    if (clash)
      throw new ConflictException({
        success: false,
        error: { code: 'CONFLICT', message: 'Slug exists.' },
      });
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
    if (clash)
      throw new ConflictException({
        success: false,
        error: { code: 'CONFLICT', message: 'Slug exists.' },
      });
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
      ...(input.contingencyPercent !== undefined
        ? { contingencyPercent: input.contingencyPercent }
        : {}),
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
          (room.lengthFt && room.widthFt
            ? Math.round(room.lengthFt * room.widthFt * 100) / 100
            : 0);
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
      breakdown.push(
        ...roomRows.map((row) => ({
          label: `${row.label} (${row.areaSqft} sq ft)`,
          amount: row.amount,
        })),
      );
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
        ? roomRows.map((row) => ({
            name: row.label,
            areaSqft: row.areaSqft,
            materialCost: row.amount,
          }))
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
    const basePerSqft = quality === 'premium' ? 2200 : quality === 'basic' ? 1400 : 1800;
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

  private requireUser(userId?: string | null) {
    if (!userId) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required.' },
      });
    }
    return userId;
  }

  async listSavedCalculations(userId?: string | null, projectId?: string) {
    const uid = this.requireUser(userId);
    return this.repos.constructionCalculations.listForUser(uid, projectId);
  }

  async getSavedCalculation(id: string, userId?: string | null) {
    const uid = this.requireUser(userId);
    const row = await this.repos.constructionCalculations.findByIdForUser(id, uid);
    if (!row) throw this.notFound('Saved calculation not found.');
    return row;
  }

  async saveConstructionCalculation(
    input: import('@varnarc/validation').SaveConstructionCalculationInput,
    userId?: string | null,
  ) {
    const uid = this.requireUser(userId);
    const payload = buildPersistedCalculationPayload(input);

    if (payload.projectId) {
      const project = await this.repos.constructionProjects.findById(payload.projectId, uid);
      if (!project) throw this.notFound('Project not found.');
    }

    return this.repos.constructionCalculations.create({
      userId: uid,
      projectId: payload.projectId,
      calculatorSlug: payload.calculatorSlug,
      name: payload.name,
      methodologyKey: payload.methodologyKey,
      methodologyVersion: payload.methodologyVersion,
      inputs: payload.inputs as never,
      assumptions: payload.assumptions as never,
      outputs: payload.outputs as never,
      unitSummary: payload.unitSummary as never,
      currency: payload.currency,
      status: payload.status,
    });
  }

  async updateSavedCalculation(
    input: { id: string } & import('@varnarc/validation').UpdateSavedConstructionCalculationInput,
    userId?: string | null,
  ) {
    const uid = this.requireUser(userId);
    const existing = await this.repos.constructionCalculations.findByIdForUser(input.id, uid);
    if (!existing) throw this.notFound('Saved calculation not found.');

    if (input.name != null) {
      await this.repos.constructionCalculations.renameForUser(input.id, uid, input.name);
    }
    if (input.projectId !== undefined) {
      if (input.projectId) {
        const project = await this.repos.constructionProjects.findById(input.projectId, uid);
        if (!project) throw this.notFound('Project not found.');
      }
      await this.repos.constructionCalculations.attachProjectForUser(
        input.id,
        uid,
        input.projectId,
      );
    }
    return this.repos.constructionCalculations.findByIdForUser(input.id, uid);
  }

  async duplicateSavedCalculation(id: string, userId?: string | null) {
    const uid = this.requireUser(userId);
    const existing = await this.repos.constructionCalculations.findByIdForUser(id, uid);
    if (!existing) throw this.notFound('Saved calculation not found.');
    return this.repos.constructionCalculations.create({
      userId: uid,
      projectId: existing.projectId,
      calculatorSlug: existing.calculatorSlug,
      name: `${existing.name ?? 'Calculation'} (copy)`,
      methodologyKey: existing.methodologyKey,
      methodologyVersion: existing.methodologyVersion,
      inputs: existing.inputs as never,
      assumptions: existing.assumptions as never,
      outputs: existing.outputs as never,
      unitSummary: existing.unitSummary as never,
      currency: existing.currency,
      status: existing.status,
    });
  }

  async deleteSavedCalculation(id: string, userId?: string | null) {
    const uid = this.requireUser(userId);
    const existing = await this.repos.constructionCalculations.findByIdForUser(id, uid);
    if (!existing) throw this.notFound('Saved calculation not found.');
    await this.repos.constructionCalculations.softDeleteForUser(id, uid);
    return { ok: true };
  }

  async recalculateSavedCalculation(id: string, userId?: string | null) {
    const uid = this.requireUser(userId);
    const existing = await this.repos.constructionCalculations.findByIdForUser(id, uid);
    if (!existing) throw this.notFound('Saved calculation not found.');
    return {
      saved: existing,
      comparison: recalculateSavedConstructionCalculation({
        calculatorSlug: existing.calculatorSlug,
        inputs: existing.inputs,
        outputs: existing.outputs,
        assumptions: existing.assumptions,
      }),
    };
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
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.areaSqft !== undefined ? { areaSqft: input.areaSqft } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.quality !== undefined ? { quality: input.quality } : {}),
      ...(input.currency != null ? { currency: input.currency } : {}),
      ...(input.estimatedCost !== undefined ? { estimatedCost: input.estimatedCost } : {}),
      ...(input.breakdown !== undefined ? { breakdown: input.breakdown as never } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
      ...(input.targetEndAt !== undefined ? { targetEndAt: input.targetEndAt } : {}),
    });
  }

  compare(query: ConstructionCompareQuery) {
    return this.repos.constructionMaterials.findManyByIds(query.ids);
  }

  async listProjects(userId?: string | null, admin = false) {
    if (admin) return this.repos.constructionProjects.listAdmin({ limit: 50 });
    if (!userId)
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required.' },
      });
    return this.repos.constructionProjects.listForUser(userId);
  }

  async createProject(input: CreateConstructionProjectInput, userId?: string | null) {
    if (!userId)
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required.' },
      });
    const items = (input.items ?? []).map((item) => {
      const unitCost = item.unitCost ?? 0;
      const estimatedCost = item.estimatedCost ?? unitCost * item.quantity;
      return {
        materialId: item.materialId,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitCost,
        estimatedCost,
      };
    });
    const itemsTotal = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    let estimatedCost = input.estimatedCost ?? null;
    if (estimatedCost == null && itemsTotal > 0) {
      estimatedCost = itemsTotal;
    }
    if (estimatedCost == null && input.areaSqft != null && input.areaSqft > 0) {
      const quality = input.quality ?? 'standard';
      estimatedCost = this.materialCostForArea(Number(input.areaSqft), quality, 1);
    }

    const row = await this.repos.constructionProjects.create({
      userId,
      name: input.name,
      projectType: input.projectType,
      status: input.status ?? 'DRAFT',
      areaSqft: input.areaSqft ?? null,
      region: input.region ?? null,
      quality: input.quality ?? null,
      currency: input.currency ?? 'INR',
      estimatedCost,
      breakdown: (input.breakdown ?? null) as never,
      notes: input.notes ?? null,
      startedAt: input.startedAt ?? null,
      targetEndAt: input.targetEndAt ?? null,
      items: {
        create: items.map((i) => ({
          ...(i.materialId ? { material: { connect: { id: i.materialId } } } : {}),
          name: i.name,
          unit: i.unit,
          quantity: i.quantity,
          unitCost: i.unitCost,
          estimatedCost: i.estimatedCost,
        })),
      },
    });
    return row;
  }

  async getProject(id: string, userId?: string | null, admin = false) {
    if (!admin && !userId) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required.' },
      });
    }
    const row = await this.repos.constructionProjects.findById(
      id,
      admin ? undefined : userId || undefined,
    );
    if (!row) throw this.notFound('Project not found.');
    return row;
  }

  async deleteProject(id: string, userId?: string | null, admin = false) {
    const row = await this.repos.constructionProjects.findById(
      id,
      admin ? undefined : userId || undefined,
    );
    if (!row) throw this.notFound('Project not found.');
    await this.repos.constructionProjects.softDelete(id);
    return { id, deleted: true };
  }

  private async assertProjectAccess(projectId: string, userId?: string | null, admin = false) {
    if (!admin && !userId) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required.' },
      });
    }
    const project = await this.repos.constructionProjects.findById(
      projectId,
      admin ? undefined : userId || undefined,
    );
    if (!project) throw this.notFound('Project not found.');
    return project;
  }

  async listProjectBoqs(projectId: string, userId?: string | null, admin = false) {
    await this.assertProjectAccess(projectId, userId, admin);
    return this.repos.constructionBoqs.listForProject(projectId);
  }

  async getBoq(boqId: string, userId?: string | null, admin = false) {
    const boq = await this.repos.constructionBoqs.findById(boqId);
    if (!boq) throw this.notFound('BOQ not found.');
    await this.assertProjectAccess(boq.projectId, userId, admin);
    return boq;
  }

  async createProjectBoq(
    projectId: string,
    input: SaveConstructionProjectBoqInput,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    const version =
      input.version ?? (await this.repos.constructionBoqs.nextVersion(projectId, input.name));

    const items = input.items.map((item, index) => {
      const amount = computeBoqLineAmount({
        quantity: item.quantity,
        unitRate: item.unitRate,
        wastagePercent: item.wastagePercent,
      });
      if (!Number.isFinite(amount)) {
        throw new BadRequestException({
          success: false,
          error: { code: 'INVALID_BOQ_ITEM', message: `Invalid amount for item "${item.name}".` },
        });
      }
      return {
        name: item.name,
        description: item.description ?? null,
        unit: item.unit,
        quantity: item.quantity,
        unitRate: item.unitRate,
        wastagePercent: item.wastagePercent ?? null,
        amount,
        sortOrder: item.sortOrder ?? index,
        metadata: (item.metadata ?? null) as never,
      };
    });

    const notesParts = [
      input.notes?.trim() || null,
      input.contingencyPercent != null ? `contingencyPercent=${input.contingencyPercent}` : null,
      input.taxPercent != null ? `taxPercent=${input.taxPercent}` : null,
      'source=boq-generator',
      'qualification=indicative-planning-boq-not-tender',
    ].filter(Boolean);

    try {
      return await this.repos.constructionBoqs.create({
        project: { connect: { id: projectId } },
        name: input.name,
        version,
        status: input.status ?? 'DRAFT',
        currency: input.currency ?? 'INR',
        notes: notesParts.join('\n').slice(0, 5000),
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
        items: {
          create: items,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save BOQ.';
      if (/unique|Unique|P2002/i.test(message)) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'BOQ_VERSION_CONFLICT',
            message: 'A BOQ with this name and version already exists.',
          },
        });
      }
      throw err;
    }
  }

  async duplicateBoq(boqId: string, userId?: string | null, admin = false) {
    const source = await this.getBoq(boqId, userId, admin);
    const version = await this.repos.constructionBoqs.nextVersion(source.projectId, source.name);
    return this.repos.constructionBoqs.create({
      project: { connect: { id: source.projectId } },
      name: source.name,
      version,
      status: 'DRAFT',
      currency: source.currency,
      notes: source.notes,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
      items: {
        create: source.items.map((item, index) => ({
          name: item.name,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitRate: item.unitRate,
          wastagePercent: item.wastagePercent,
          amount: item.amount,
          sortOrder: item.sortOrder ?? index,
          metadata: item.metadata as never,
          ...(item.materialId ? { material: { connect: { id: item.materialId } } } : {}),
          ...(item.phaseId ? { phase: { connect: { id: item.phaseId } } } : {}),
        })),
      },
    });
  }

  async boqReportPdf(boqId: string, userId?: string | null, admin = false) {
    const boq = await this.getBoq(boqId, userId, admin);
    const lines: string[] = [
      'Varnarc Indicative Planning BOQ',
      'NOT a professional tender BOQ / QS schedule',
      `${boq.name} · v${boq.version} · ${boq.currency}`,
      '',
    ];
    let running = 0;
    const maxItems = 35;
    for (const item of boq.items.slice(0, maxItems)) {
      const qty = Number(item.quantity);
      const rate = Number(item.unitRate);
      const amount = Number(item.amount);
      running += amount;
      lines.push(`${item.name} | ${item.unit} | qty ${qty} | rate ${rate} | amt ${amount}`);
    }
    if (boq.items.length > maxItems) {
      lines.push(`... ${boq.items.length - maxItems} more items (export CSV for full list)`);
    }
    lines.push('');
    lines.push(`Listed items amount (partial if truncated): ${Math.round(running * 100) / 100}`);
    lines.push('Indicative planning BOQ only — verify quantities and rates locally.');
    return minimalEstimatePdf(lines);
  }

  async listProjectPhases(projectId: string, userId?: string | null, admin = false) {
    await this.assertProjectAccess(projectId, userId, admin);
    return this.repos.constructionProjectPhases.listForProject(projectId);
  }

  async replaceProjectPhases(
    projectId: string,
    input: ReplaceConstructionProjectPhasesInput,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    return this.repos.constructionProjectPhases.replaceForProject(
      projectId,
      input.phases.map((p, index) => ({
        name: p.name,
        slug: p.slug ?? null,
        sortOrder: p.sortOrder ?? index,
        status: p.status ?? 'PLANNED',
        plannedStart: p.plannedStart ?? null,
        plannedEnd: p.plannedEnd ?? null,
        notes: p.notes ?? null,
      })),
    );
  }

  async listBudgetItems(projectId: string, userId?: string | null, admin = false) {
    await this.assertProjectAccess(projectId, userId, admin);
    return this.repos.constructionBudgetItems.listForProject(projectId);
  }

  async createBudgetItem(
    projectId: string,
    input: SaveConstructionBudgetItemInput,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    return this.repos.constructionBudgetItems.create({
      project: { connect: { id: projectId } },
      ...(input.phaseId ? { phase: { connect: { id: input.phaseId } } } : {}),
      category: input.category,
      name: input.name,
      plannedAmount: input.plannedAmount,
      currency: input.currency ?? 'INR',
      notes: input.notes ?? null,
    });
  }

  async deleteBudgetItem(itemId: string, userId?: string | null, admin = false) {
    const item = await this.repos.constructionBudgetItems.findById(itemId);
    if (!item) throw this.notFound('Budget item not found.');
    await this.assertProjectAccess(item.projectId, userId, admin);
    await this.repos.constructionBudgetItems.softDelete(itemId);
    return { id: itemId, deleted: true };
  }

  async listExpenses(projectId: string, userId?: string | null, admin = false) {
    await this.assertProjectAccess(projectId, userId, admin);
    return this.repos.constructionExpenses.listForProject(projectId);
  }

  async createExpense(
    projectId: string,
    input: SaveConstructionExpenseInput,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    const notes = encodeExpenseNotes({
      userNotes: input.notes,
      category: input.category ?? 'Other',
      vendor: input.vendor,
      paymentStatus: input.paymentStatus ?? 'paid',
      receiptUrl: input.receiptUrl,
    });
    return this.repos.constructionExpenses.create({
      project: { connect: { id: projectId } },
      ...(input.budgetItemId ? { budgetItem: { connect: { id: input.budgetItemId } } } : {}),
      ...(input.phaseId ? { phase: { connect: { id: input.phaseId } } } : {}),
      vendorBusinessId: input.vendorBusinessId ?? null,
      name: input.name,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      spentOn: input.spentOn,
      notes,
      receiptMediaId: input.receiptMediaId ?? null,
    });
  }

  async deleteExpense(expenseId: string, userId?: string | null, admin = false) {
    const row = await this.repos.constructionExpenses.findById(expenseId);
    if (!row) throw this.notFound('Expense not found.');
    await this.assertProjectAccess(row.projectId, userId, admin);
    await this.repos.constructionExpenses.softDelete(expenseId);
    return { id: expenseId, deleted: true };
  }

  private serializeDocument(doc: {
    id: string;
    projectId: string;
    kind: string;
    title: string;
    notes: string | null;
    storageKey?: string | null;
    originalFilename?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    boqId?: string | null;
    expenseId?: string | null;
    phaseId?: string | null;
    quoteDocumentId?: string | null;
    metadata?: unknown;
    uploadedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    url?: string | null;
    mediaId?: string | null;
  }) {
    return {
      id: doc.id,
      projectId: doc.projectId,
      kind: doc.kind,
      title: doc.title,
      notes: doc.notes,
      originalFilename: doc.originalFilename ?? null,
      mimeType: doc.mimeType ?? null,
      sizeBytes: doc.sizeBytes ?? null,
      boqId: doc.boqId ?? null,
      expenseId: doc.expenseId ?? null,
      phaseId: doc.phaseId ?? null,
      quoteDocumentId: doc.quoteDocumentId ?? null,
      metadata: doc.metadata ?? null,
      uploadedBy: doc.uploadedBy ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      hasFile: Boolean(doc.storageKey || doc.mediaId),
      // Private access only — never return storageKey or public GCS/url
    };
  }

  async listDocuments(projectId: string, userId?: string | null, admin = false, kind?: string) {
    await this.assertProjectAccess(projectId, userId, admin);
    const rows = await this.repos.constructionDocuments.listForProject(
      projectId,
      kind ? { kind } : undefined,
    );
    return rows.map((r) => this.serializeDocument(r));
  }

  async getDocument(documentId: string, userId?: string | null, admin = false) {
    const row = await this.repos.constructionDocuments.findById(documentId);
    if (!row) throw this.notFound('Document not found.');
    await this.assertProjectAccess(row.projectId, userId, admin);
    return this.serializeDocument(row);
  }

  private emptyUuid(v?: string | null) {
    if (!v || v === '') return null;
    return v;
  }

  async uploadProjectDocument(
    projectId: string,
    file: Express.Multer.File,
    meta: SaveConstructionDocumentMetaInput,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_FILE', message: 'No file uploaded.' },
      });
    }

    const parsed = saveConstructionDocumentMetaSchema.parse(meta);
    this.storage.validateUpload(file);

    const safeName = sanitizeDocumentFilename(file.originalname);
    const folderPath = `construction-vault/${projectId}`;
    const uploaded = await this.storage.upload(
      {
        ...file,
        originalname: safeName,
      },
      { folderPath },
    );

    // Create MediaAsset for reuse / audit trail — do not expose its public URL to clients
    let mediaId: string | null = null;
    try {
      const asset = await this.repos.mediaAssets.create({
        publicId: uploaded.publicId,
        url: uploaded.url,
        secureUrl: uploaded.secureUrl,
        resourceType: uploaded.resourceType,
        originalName: safeName,
        fileName: safeName,
        mimeType: file.mimetype,
        format: uploaded.format ?? null,
        bytes: uploaded.bytes ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      });
      mediaId = asset.id;
    } catch {
      // Document row still stores storageKey if media create fails (e.g. duplicate)
    }

    const row = await this.repos.constructionDocuments.create({
      projectId,
      kind: parsed.kind,
      title: parsed.title,
      notes: parsed.notes ?? null,
      storageKey: uploaded.publicId,
      originalFilename: safeName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      url: null,
      mediaId,
      uploadedBy: userId ?? null,
      boqId: this.emptyUuid(parsed.boqId),
      expenseId: this.emptyUuid(parsed.expenseId),
      phaseId: this.emptyUuid(parsed.phaseId),
      quoteDocumentId: this.emptyUuid(parsed.quoteDocumentId),
      metadata: {
        vault: true,
        private: true,
        version: '2026.08.1',
      } as never,
    });

    return this.serializeDocument(row);
  }

  async downloadDocumentFile(documentId: string, userId?: string | null, admin = false) {
    const row = await this.repos.constructionDocuments.findById(documentId);
    if (!row) throw this.notFound('Document not found.');
    await this.assertProjectAccess(row.projectId, userId, admin);

    let storageKey = row.storageKey;
    if (!storageKey && row.mediaId) {
      const asset = await this.repos.mediaAssets.findById(row.mediaId);
      storageKey = asset?.publicId ?? null;
    }
    if (!storageKey) {
      throw this.notFound('File not found for this document.');
    }

    const { buffer, contentType } = await this.storage.downloadBuffer(storageKey);
    return {
      buffer,
      contentType: contentType || row.mimeType || 'application/octet-stream',
      filename: row.originalFilename || sanitizeDocumentFilename(row.title) || 'document',
    };
  }

  async deleteDocument(documentId: string, userId?: string | null, admin = false) {
    const row = await this.repos.constructionDocuments.findById(documentId);
    if (!row) throw this.notFound('Document not found.');
    await this.assertProjectAccess(row.projectId, userId, admin);
    await this.repos.constructionDocuments.softDelete(documentId);
    return { id: documentId, deleted: true };
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

  private serializePriceObservation(row: {
    id: string;
    price: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
    unit: string;
    currency: string;
    source?: string | null;
    sourceUrl?: string | null;
    notes?: string | null;
    freshness: 'LIVE' | 'VERIFIED' | 'ESTIMATED' | 'STALE';
    effectiveFrom: Date;
    verifiedAt?: Date | null;
    updatedAt: Date;
    material?: { id: string; name: string; slug: string; unit: string } | null;
    location?: { id: string; name: string; slug: string; type: string } | null;
    brand?: { id: string; name: string; slug: string } | null;
  }) {
    const display = resolveDisplayFreshness({
      claimed: row.freshness,
      verifiedAt: row.verifiedAt,
      effectiveFrom: row.effectiveFrom,
    });
    const sourceCategory = normalizePriceSourceCategory(row.source);
    const hubKey = row.material ? matchMaterialToHubKey(row.material.slug) : null;
    const price = Number(row.price);
    const minPrice = row.minPrice != null ? Number(row.minPrice) : null;
    const maxPrice = row.maxPrice != null ? Number(row.maxPrice) : null;
    return {
      id: row.id,
      price,
      minPrice,
      maxPrice,
      unit: row.unit,
      currency: row.currency,
      source: row.source,
      sourceUrl: row.sourceUrl ?? null,
      notes: row.notes ?? null,
      sourceCategory,
      sourceCategoryLabel: PRICE_SOURCE_CATEGORY_LABELS[sourceCategory],
      claimedFreshness: row.freshness,
      freshness: display.resolved,
      freshnessLabel: display.label,
      isCurrent: display.isCurrent,
      isOlderData: display.isOlderData,
      ageDays: display.ageDays,
      effectiveFrom: row.effectiveFrom.toISOString(),
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
      lastUpdated: (row.verifiedAt ?? row.effectiveFrom ?? row.updatedAt).toISOString(),
      material: row.material
        ? {
            id: row.material.id,
            name: row.material.name,
            slug: row.material.slug,
            hubKey,
            unit: row.material.unit,
          }
        : null,
      location: row.location
        ? {
            id: row.location.id,
            name: row.location.name,
            slug: row.location.slug,
            type: row.location.type,
          }
        : null,
      brand: row.brand ? { id: row.brand.id, name: row.brand.name, slug: row.brand.slug } : null,
    };
  }

  async listPriceHub(query?: { material?: string; location?: string }) {
    const materialKey =
      query?.material && isPriceHubMaterialKey(query.material) ? query.material : undefined;
    const locationSlug =
      query?.location && isPriceHubCitySlug(query.location) ? query.location : undefined;

    const materialSlugAliases = materialKey
      ? PRICE_HUB_MATERIALS.filter((m) => m.key === materialKey).flatMap((m) => {
          if (m.key === 'brick') return ['brick', 'bricks', 'aac-blocks', 'aac'];
          if (m.key === 'tiles') return ['tiles', 'tile'];
          if (m.key === 'steel') return ['steel', 'tmt', 'tmt-steel'];
          return [m.key];
        })
      : PRICE_HUB_MATERIALS.flatMap((m) =>
          m.key === 'brick'
            ? ['brick', 'bricks', 'aac-blocks']
            : m.key === 'tiles'
              ? ['tiles', 'tile']
              : [m.key],
        );

    const rows = await this.repos.constructionMaterialPrices.listFiltered({
      materialSlugs: materialSlugAliases,
      locationSlugs: locationSlug ? [locationSlug] : PRICE_HUB_CITIES.map((c) => c.slug),
      take: 300,
    });

    const observations = rows.map((r) => this.serializePriceObservation(r));

    // Latest per material+location (prefer current over older when same pair)
    const latestMap = new Map<string, (typeof observations)[number]>();
    for (const obs of observations) {
      const key = `${obs.material?.hubKey ?? obs.material?.slug ?? 'x'}::${obs.location?.slug ?? 'national'}`;
      const existing = latestMap.get(key);
      if (!existing) {
        latestMap.set(key, obs);
        continue;
      }
      if (obs.isCurrent && !existing.isCurrent) {
        latestMap.set(key, obs);
        continue;
      }
      if (obs.isCurrent === existing.isCurrent && obs.lastUpdated > existing.lastUpdated) {
        latestMap.set(key, obs);
      }
    }

    const latest = [...latestMap.values()].sort((a, b) =>
      a.isCurrent === b.isCurrent ? 0 : a.isCurrent ? -1 : 1,
    );

    const cities = await this.repos.constructionLocations.listCities(
      PRICE_HUB_CITIES.map((c) => c.slug),
    );
    const cityOptions = PRICE_HUB_CITIES.map((c) => ({
      slug: c.slug,
      name: cities.find((x) => x.slug === c.slug)?.name ?? c.name,
      hasData: latest.some((o) => o.location?.slug === c.slug && o.isCurrent),
    }));

    const materialOptions = PRICE_HUB_MATERIALS.map((m) => ({
      key: m.key,
      label: m.label,
      unitHint: m.unitHint,
      calculatorHref: m.calculatorHref,
      hasData: latest.some((o) => o.material?.hubKey === m.key && o.isCurrent),
    }));

    return {
      materials: materialOptions,
      locations: cityOptions,
      latest,
      observationCount: observations.length,
      currentCount: latest.filter((o) => o.isCurrent).length,
      olderCount: latest.filter((o) => o.isOlderData).length,
    };
  }

  async getPriceLanding(materialKey: string, citySlug: string) {
    if (!isPriceHubMaterialKey(materialKey) || !isPriceHubCitySlug(citySlug)) {
      return null;
    }
    const materialMeta = getPriceHubMaterial(materialKey)!;
    const cityMeta = getPriceHubCity(citySlug)!;

    const observations = await this.loadPricePairObservations(materialKey, citySlug);

    const indexable = canIndexPriceLanding({
      materialKey,
      citySlug,
      observations: observations.map((o) => ({
        claimed: o.claimedFreshness,
        verifiedAt: o.verifiedAt,
        effectiveFrom: o.effectiveFrom,
      })),
    });

    if (!indexable) return null;

    const current = observations.find((o) => o.isCurrent) ?? null;
    const historyAsc = [...observations].sort((a, b) =>
      a.effectiveFrom < b.effectiveFrom ? -1 : 1,
    );
    const showChart = shouldShowPriceHistoryChart(historyAsc.length);
    const changes = current
      ? computePricePeriodChanges({
          currentPrice: current.price,
          observations: historyAsc.map((o) => ({
            id: o.id,
            price: o.price,
            effectiveFrom: o.effectiveFrom,
          })),
        })
      : PRICE_HISTORY_CHANGE_PERIODS.map((period) => ({
          key: period.key,
          label: period.label,
          available: false,
          absolute: null,
          percent: null,
          baselinePrice: null,
          baselineDate: null,
          usedNearestPrior: false,
        }));

    const relatedMaterials: Array<{ key: typeof materialKey; label: string }> = [];
    for (const m of PRICE_HUB_MATERIALS) {
      if (m.key === materialKey) continue;
      if (await this.isPricePairIndexable(m.key, citySlug)) {
        relatedMaterials.push({ key: m.key, label: m.label });
      }
    }

    const relatedCities: Array<{ slug: typeof citySlug; name: string }> = [];
    for (const c of PRICE_HUB_CITIES) {
      if (c.slug === citySlug) continue;
      if (await this.isPricePairIndexable(materialKey, c.slug)) {
        relatedCities.push({ slug: c.slug, name: c.name });
      }
    }

    const seo = buildPriceLandingSeoContent({
      materialKey,
      materialLabel: materialMeta.label,
      citySlug,
      cityName: cityMeta.name,
      calculatorHref: materialMeta.calculatorHref,
      currentPrice: current?.price ?? null,
      unit: current?.unit ?? historyAsc[0]?.unit ?? null,
      currency: current?.currency ?? historyAsc[0]?.currency ?? 'INR',
      historyPrices: historyAsc.map((o) => o.price),
      lastUpdatedIso:
        current?.verifiedAt ??
        current?.lastUpdated ??
        historyAsc[historyAsc.length - 1]?.lastUpdated ??
        null,
      relatedMaterials,
      relatedCities,
    });

    if (!seo) return null;

    return {
      material: materialMeta,
      city: cityMeta,
      current,
      older: observations.filter((o) => o.isOlderData),
      history: historyAsc,
      changes,
      showChart,
      seo,
      indexable: true as const,
      canonicalPath: `/construction/prices/${materialKey}/${citySlug}`,
    };
  }

  /** History for hub UI — allowlisted pairs with any observations (not SEO-gated). */
  async getPricePairHistory(materialKey: string, citySlug: string) {
    if (!isPriceHubMaterialKey(materialKey) || !isPriceHubCitySlug(citySlug)) {
      return null;
    }
    const materialMeta = getPriceHubMaterial(materialKey)!;
    const cityMeta = getPriceHubCity(citySlug)!;

    const observations = await this.loadPricePairObservations(materialKey, citySlug);

    if (!observations.length) return null;

    const current = observations.find((o) => o.isCurrent) ?? null;
    const historyAsc = [...observations].sort((a, b) =>
      a.effectiveFrom < b.effectiveFrom ? -1 : 1,
    );
    const showChart = shouldShowPriceHistoryChart(historyAsc.length);
    const changes = current
      ? computePricePeriodChanges({
          currentPrice: current.price,
          observations: historyAsc.map((o) => ({
            id: o.id,
            price: o.price,
            effectiveFrom: o.effectiveFrom,
          })),
        })
      : PRICE_HISTORY_CHANGE_PERIODS.map((period) => ({
          key: period.key,
          label: period.label,
          available: false,
          absolute: null,
          percent: null,
          baselinePrice: null,
          baselineDate: null,
          usedNearestPrior: false,
        }));

    return {
      material: materialMeta,
      city: cityMeta,
      current,
      older: observations.filter((o) => o.isOlderData),
      history: historyAsc,
      changes,
      showChart,
      canonicalPath: `/construction/prices/${materialKey}/${citySlug}`,
      indexable: canIndexPriceLanding({
        materialKey,
        citySlug,
        observations: observations.map((o) => ({
          claimed: o.claimedFreshness,
          verifiedAt: o.verifiedAt,
          effectiveFrom: o.effectiveFrom,
        })),
      }),
    };
  }

  private priceHubMaterialSlugs(materialKey: string): string[] {
    if (materialKey === 'brick') return ['brick', 'bricks', 'aac-blocks', 'aac'];
    if (materialKey === 'tiles') return ['tiles', 'tile'];
    if (materialKey === 'steel') return ['steel', 'tmt', 'tmt-steel'];
    return [materialKey];
  }

  private async loadPricePairObservations(materialKey: string, citySlug: string) {
    const rows = await this.repos.constructionMaterialPrices.listFiltered({
      materialSlugs: this.priceHubMaterialSlugs(materialKey),
      locationSlugs: [citySlug],
      take: 500,
    });
    return rows
      .map((r) => this.serializePriceObservation(r))
      .filter((o) => o.material?.hubKey === materialKey)
      .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  }

  private async isPricePairIndexable(materialKey: string, citySlug: string) {
    if (!isPriceHubMaterialKey(materialKey) || !isPriceHubCitySlug(citySlug)) {
      return false;
    }
    const observations = await this.loadPricePairObservations(materialKey, citySlug);
    return canIndexPriceLanding({
      materialKey,
      citySlug,
      observations: observations.map((o) => ({
        claimed: o.claimedFreshness,
        verifiedAt: o.verifiedAt,
        effectiveFrom: o.effectiveFrom,
      })),
    });
  }

  async listIndexablePriceLandings() {
    const pairs: Array<{ material: string; city: string }> = [];
    for (const m of PRICE_HUB_MATERIALS) {
      for (const c of PRICE_HUB_CITIES) {
        if (await this.isPricePairIndexable(m.key, c.slug)) {
          pairs.push({ material: m.key, city: c.slug });
        }
      }
    }
    return { pairs };
  }

  private async collectCityMaterialObservations(citySlug: string) {
    const rows = await this.repos.constructionMaterialPrices.listFiltered({
      locationSlugs: [citySlug],
      take: 800,
    });
    return rows
      .map((r) => this.serializePriceObservation(r))
      .filter((o) => o.material?.hubKey)
      .map((o) => ({
        materialKey: o.material!.hubKey as string,
        price: o.price,
        unit: o.unit,
        currency: o.currency,
        claimed: o.claimedFreshness as 'LIVE' | 'VERIFIED' | 'ESTIMATED' | 'STALE',
        verifiedAt: o.verifiedAt,
        effectiveFrom: o.effectiveFrom,
      }));
  }

  async getConstructionCostCityLanding(citySlug: string) {
    if (!isConstructionCostCitySlug(citySlug) || !getConstructionCostCityProfile(citySlug)) {
      return null;
    }
    const observations = await this.collectCityMaterialObservations(citySlug);

    const related: string[] = [];
    for (const slug of listConstructionCostCityProfileSlugs()) {
      if (slug === citySlug) continue;
      const obs = await this.collectCityMaterialObservations(slug);
      const gate = canIndexConstructionCostCity({ citySlug: slug, observations: obs });
      if (gate.indexable) related.push(slug);
    }

    const landing = buildConstructionCostCityLanding({
      citySlug,
      observations,
      relatedIndexableCitySlugs: related,
    });
    if (!landing || !landing.indexable) return null;
    return landing;
  }

  async listIndexableConstructionCostCities() {
    const cities: Array<{ city: string; name: string; path: string }> = [];
    for (const slug of listConstructionCostCityProfileSlugs()) {
      const landing = await this.getConstructionCostCityLanding(slug);
      if (landing) {
        cities.push({
          city: landing.city.slug,
          name: landing.city.name,
          path: landing.canonicalPath,
        });
      }
    }
    return { cities, potential: listPotentialConstructionCostCities() };
  }

  getFairPriceCheckerMeta() {
    return {
      version: FAIR_PRICE_CHECKER_VERSION,
      qualification: FAIR_PRICE_CHECKER_QUALIFICATION,
      methodology: FAIR_PRICE_METHODOLOGY,
      materials: getFairPriceMaterialOptions(),
      cities: getFairPriceCityOptions(),
      units: FAIR_PRICE_UNITS.map((u) => ({ key: u.key, label: u.label })),
    };
  }

  getProjectReadinessMeta() {
    return getProjectReadinessMeta();
  }

  evaluateProjectReadiness(raw: ProjectReadinessInput) {
    return scoreProjectReadiness(projectReadinessInputSchema.parse(raw));
  }

  async checkFairPrice(raw: FairPriceCheckInput) {
    const input = fairPriceCheckInputSchema.parse(raw);
    if (!isPriceHubMaterialKey(input.materialKey) || !isPriceHubCitySlug(input.locationSlug)) {
      return evaluateFairPriceCheck({
        ...input,
        observations: [],
      });
    }

    const materialSlugs =
      input.materialKey === 'brick'
        ? ['brick', 'bricks', 'aac-blocks', 'aac']
        : input.materialKey === 'tiles'
          ? ['tiles', 'tile']
          : input.materialKey === 'steel'
            ? ['steel', 'tmt', 'tmt-steel']
            : [input.materialKey];

    const rows = await this.repos.constructionMaterialPrices.listFiltered({
      materialSlugs,
      locationSlugs: [input.locationSlug],
      take: 100,
    });

    // If city coverage is thin, also pull national/unscoped rows for the same material (labelled mixed/national).
    let nationalRows: typeof rows = [];
    if (rows.length < 2) {
      const broader = await this.repos.constructionMaterialPrices.listFiltered({
        materialSlugs,
        take: 100,
      });
      nationalRows = broader.filter((r) => !r.locationId || !rows.some((x) => x.id === r.id));
    }

    const combined = [...rows, ...nationalRows];
    const observations = combined
      .map((r) => {
        const hubKey = r.material ? matchMaterialToHubKey(r.material.slug) : null;
        if (hubKey !== input.materialKey) return null;
        return {
          id: r.id,
          price: Number(r.price),
          minPrice: r.minPrice != null ? Number(r.minPrice) : null,
          maxPrice: r.maxPrice != null ? Number(r.maxPrice) : null,
          unit: r.unit,
          currency: r.currency,
          claimed: r.freshness,
          verifiedAt: r.verifiedAt,
          effectiveFrom: r.effectiveFrom,
          locationSlug: r.location?.slug ?? null,
          locationType: r.location?.type ?? null,
        };
      })
      .filter((o): o is NonNullable<typeof o> => o != null);

    return evaluateFairPriceCheck({
      materialKey: input.materialKey,
      locationSlug: input.locationSlug,
      quotedUnit: input.quotedUnit,
      quotedPrice: input.quotedPrice,
      quantity: input.quantity,
      currency: input.currency,
      observations,
    });
  }

  private serializeVcciMethodology(row: {
    id: string;
    version: string;
    label: string;
    baselineLabel: string;
    baselineStart: Date;
    baselineEnd: Date;
    baselineIndex: unknown;
    weights: unknown;
    notes?: string | null;
    isActive: boolean;
  }) {
    return {
      id: row.id,
      version: row.version,
      label: row.label,
      baseline: {
        label: row.baselineLabel,
        start: row.baselineStart.toISOString().slice(0, 10),
        end: row.baselineEnd.toISOString().slice(0, 10),
        indexLevel: Number(row.baselineIndex),
      },
      weights: (row.weights ?? defaultVcciWeights()) as Record<string, number>,
      notes: row.notes ?? null,
      isActive: row.isActive,
    };
  }

  private serializeVcciSnapshot(row: {
    id: string;
    methodologyVersion: string;
    scope: string;
    componentKey?: string | null;
    indexValue: unknown;
    calculationDate: Date;
    componentIndexes?: unknown;
    componentWeights?: unknown;
    sourceDatasets?: unknown;
    coverageRatio?: unknown;
    qualityPassed: boolean;
    qualityBlockers?: unknown;
    status: string;
    publishedAt?: Date | null;
    notes?: string | null;
    location?: { id: string; name: string; slug: string; type: string } | null;
    methodology?: {
      id: string;
      version: string;
      label: string;
      baselineLabel: string;
      baselineStart: Date;
      baselineEnd: Date;
      baselineIndex: unknown;
      weights: unknown;
    } | null;
  }) {
    return {
      id: row.id,
      methodologyVersion: row.methodologyVersion,
      scope: row.scope,
      componentKey: row.componentKey ?? null,
      componentLabel: row.componentKey
        ? (getVcciComponent(row.componentKey)?.label ?? row.componentKey)
        : null,
      indexValue: Number(row.indexValue),
      calculationDate: row.calculationDate.toISOString().slice(0, 10),
      componentIndexes: (row.componentIndexes ?? {}) as Record<string, number>,
      componentWeights: (row.componentWeights ?? {}) as Record<string, number>,
      sourceDatasets: Array.isArray(row.sourceDatasets) ? row.sourceDatasets : [],
      coverageRatio: row.coverageRatio != null ? Number(row.coverageRatio) : null,
      qualityPassed: row.qualityPassed,
      qualityBlockers: Array.isArray(row.qualityBlockers) ? row.qualityBlockers : [],
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      notes: row.notes ?? null,
      location: row.location
        ? {
            id: row.location.id,
            name: row.location.name,
            slug: row.location.slug,
            type: row.location.type,
          }
        : null,
      methodology: row.methodology
        ? this.serializeVcciMethodology({
            ...row.methodology,
            notes: null,
            isActive: true,
          })
        : null,
    };
  }

  /** Public methodology — always available; never invents index numbers. */
  async getVcciMethodology() {
    const active = await this.repos.constructionVcciMethodologies.findActive();
    return {
      name: VCCI_NAME,
      shortName: VCCI_SHORT_NAME,
      frameworkVersion: VCCI_METHODOLOGY_VERSION,
      qualification: VCCI_QUALIFICATION,
      baseline: VCCI_BASELINE,
      components: VCCI_COMPONENTS.map((c) => ({
        key: c.key,
        label: c.label,
        description: c.description,
        defaultWeight: c.defaultWeight,
        sourceHint: c.sourceHint,
      })),
      sections: VCCI_METHODOLOGY_SECTIONS,
      activeMethodology: active ? this.serializeVcciMethodology(active) : null,
    };
  }

  /**
   * Public VCCI hub payload. Numeric values only when a quality-gated published
   * national snapshot exists.
   */
  async getVcciHub() {
    const methodology = await this.getVcciMethodology();
    const national = await this.repos.constructionVcciSnapshots.latestPublished({
      scope: 'NATIONAL',
    });

    const blockers: string[] = [];
    if (!methodology.activeMethodology) {
      blockers.push('No active VCCI methodology version is configured.');
    }

    let published = false;
    let current: ReturnType<ConstructionService['serializeVcciSnapshot']> | null = null;
    let quality: ReturnType<typeof assessVcciSnapshotQuality> | null = null;

    if (national) {
      const weights = (national.componentWeights ??
        national.methodology?.weights ??
        defaultVcciWeights()) as Record<string, number>;
      const componentIndexes = (national.componentIndexes ?? {}) as Record<string, number | null>;
      quality = assessVcciSnapshotQuality({
        methodologyVersion: national.methodologyVersion,
        weights,
        componentIndexes,
        sourceDatasets: Array.isArray(national.sourceDatasets)
          ? (national.sourceDatasets as Array<{ component?: string; name?: string }>)
          : [],
        calculationDate: national.calculationDate,
        explicitlyPublished: national.status === 'PUBLISHED' && national.qualityPassed,
      });
      published = canPublishVcciPublicly({
        hasActiveMethodology: Boolean(methodology.activeMethodology),
        quality,
      });
      if (published) current = this.serializeVcciSnapshot(national);
      else blockers.push(...quality.blockers);
    } else {
      blockers.push(
        'No quality-gated PUBLISHED national snapshot exists yet. Index values are withheld by design.',
      );
    }

    const historyRows = published
      ? await this.repos.constructionVcciSnapshots.listPublished({
          scope: 'NATIONAL',
          take: 60,
        })
      : [];
    const history = historyRows
      .map((r) => this.serializeVcciSnapshot(r))
      .sort((a, b) => (a.calculationDate < b.calculationDate ? -1 : 1));

    const citySlugs = [
      ...new Set(
        (
          await this.repos.constructionVcciSnapshots.listPublished({
            scope: 'CITY',
            take: 200,
          })
        )
          .map((r) => r.location?.slug)
          .filter((s): s is string => Boolean(s)),
      ),
    ];

    return {
      published,
      blockers: published ? [] : blockers,
      quality,
      methodology,
      current,
      history,
      showChart: published && shouldShowVcciHistoryChart(history.length),
      availableCities: published ? citySlugs : [],
      availableComponents: published
        ? VCCI_COMPONENTS.map((c) => ({ key: c.key, label: c.label }))
        : [],
    };
  }

  async getVcciCity(citySlug: string) {
    if (!isPriceHubCitySlug(citySlug)) return null;
    const hub = await this.getVcciHub();
    if (!hub.published) return null;

    const latest = await this.repos.constructionVcciSnapshots.latestPublished({
      scope: 'CITY',
      locationSlug: citySlug,
    });
    if (!latest) return null;

    const historyRows = await this.repos.constructionVcciSnapshots.listPublished({
      scope: 'CITY',
      locationSlug: citySlug,
      take: 60,
    });
    const history = historyRows
      .map((r) => this.serializeVcciSnapshot(r))
      .sort((a, b) => (a.calculationDate < b.calculationDate ? -1 : 1));

    return {
      published: true,
      city: {
        slug: citySlug,
        name: latest.location?.name ?? getPriceHubCity(citySlug)?.name ?? citySlug,
      },
      current: this.serializeVcciSnapshot(latest),
      history,
      showChart: shouldShowVcciHistoryChart(history.length),
      methodology: hub.methodology,
    };
  }

  async getVcciComponent(componentKey: string) {
    if (!isVcciComponentKey(componentKey)) return null;
    const hub = await this.getVcciHub();
    if (!hub.published) return null;

    const latest = await this.repos.constructionVcciSnapshots.latestPublished({
      scope: 'COMPONENT',
      componentKey,
    });

    // Fall back to national snapshot's component series when dedicated COMPONENT rows absent
    const national = hub.current;
    const componentMeta = getVcciComponent(componentKey)!;
    const fromNational =
      national &&
      national.componentIndexes &&
      typeof national.componentIndexes[componentKey] === 'number'
        ? Number(national.componentIndexes[componentKey])
        : null;

    if (!latest && fromNational == null) return null;

    const historyRows = await this.repos.constructionVcciSnapshots.listPublished({
      scope: 'COMPONENT',
      componentKey,
      take: 60,
    });
    let history = historyRows
      .map((r) => this.serializeVcciSnapshot(r))
      .sort((a, b) => (a.calculationDate < b.calculationDate ? -1 : 1));

    if (!history.length && hub.history.length) {
      history = hub.history
        .filter((h) => typeof h.componentIndexes[componentKey] === 'number')
        .map((h) => ({
          ...h,
          scope: 'COMPONENT',
          componentKey,
          componentLabel: componentMeta.label,
          indexValue: Number(h.componentIndexes[componentKey]),
        }));
    }

    const current = latest
      ? this.serializeVcciSnapshot(latest)
      : national
        ? {
            ...national,
            scope: 'COMPONENT',
            componentKey,
            componentLabel: componentMeta.label,
            indexValue: fromNational as number,
          }
        : null;

    if (!current) return null;

    return {
      published: true,
      component: {
        key: componentMeta.key,
        label: componentMeta.label,
        description: componentMeta.description,
        defaultWeight: componentMeta.defaultWeight,
        sourceHint: componentMeta.sourceHint,
      },
      current,
      history,
      showChart: shouldShowVcciHistoryChart(history.length),
      methodology: hub.methodology,
    };
  }

  async listPublishedVcciCities() {
    const hub = await this.getVcciHub();
    if (!hub.published) return { cities: [] as Array<{ slug: string; name: string }> };
    const rows = await this.repos.constructionVcciSnapshots.listPublished({
      scope: 'CITY',
      take: 200,
    });
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.location?.slug) map.set(r.location.slug, r.location.name);
    }
    return {
      cities: [...map.entries()].map(([slug, name]) => ({ slug, name })),
    };
  }

  async listChecklists(admin = false) {
    await this.ensureCanonicalChecklistsPublished();
    const rows = await this.db.constructionChecklist.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: [{ projectType: 'asc' }, { title: 'asc' }],
    });
    const mapped = rows.map((row) => {
      const items = normalizeChecklistItems(row.items, row.projectType);
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        phase: row.projectType,
        projectType: row.projectType,
        category: getCanonicalChecklist(row.slug)?.category ?? 'construction',
        status: row.status,
        itemCount: items.length,
        href: `/construction/checklists/${row.slug}`,
        items: admin ? items : undefined,
        qualification: CONSTRUCTION_CHECKLIST_QUALIFICATION,
      };
    });

    // Prefer canonical sort order when known.
    const order = new Map(
      CANONICAL_CONSTRUCTION_CHECKLISTS.map((c, i) => [c.slug, c.sortOrder ?? i]),
    );
    mapped.sort((a, b) => {
      const ao = order.get(a.slug) ?? 999;
      const bo = order.get(b.slug) ?? 999;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });
    return mapped;
  }

  async getChecklist(slug: string) {
    await this.ensureCanonicalChecklistsPublished();
    const row = await this.db.constructionChecklist.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
    });
    const canonical = getCanonicalChecklist(slug);

    if (!row && !canonical) throw this.notFound('Checklist not found.');

    const items = normalizeChecklistItems(
      row?.items ?? canonical?.items ?? [],
      row?.projectType ?? canonical?.phase,
    );

    return {
      id: row?.id ?? null,
      slug: row?.slug ?? canonical!.slug,
      title: row?.title ?? canonical!.title,
      description: row?.description ?? canonical?.description ?? null,
      phase: row?.projectType ?? canonical?.phase ?? null,
      category: canonical?.category ?? 'construction',
      seoTitle: canonical?.seoTitle ?? null,
      seoDescription: canonical?.seoDescription ?? null,
      items,
      qualification: CONSTRUCTION_CHECKLIST_QUALIFICATION,
      professionalReviewNote: CONSTRUCTION_CHECKLIST_PROFESSIONAL_REVIEW_NOTE,
      neverCertifiesCompliance: true,
      href: `/construction/checklists/${slug}`,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  }

  getChecklistSystemMeta() {
    return getConstructionChecklistMeta();
  }

  private canonicalChecklistsEnsured = false;

  /** Upsert the 11 canonical checklists so public SEO pages always have content. */
  async ensureCanonicalChecklistsPublished() {
    if (this.canonicalChecklistsEnsured) return;
    for (const c of CANONICAL_CONSTRUCTION_CHECKLISTS) {
      const existing = await this.db.constructionChecklist.findFirst({
        where: { slug: c.slug, deletedAt: null },
      });
      const items = c.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        phase: item.phase,
        professionalReviewRequired: item.professionalReviewRequired,
        sortOrder: item.sortOrder,
      }));
      if (!existing) {
        await this.db.constructionChecklist.create({
          data: {
            title: c.title,
            slug: c.slug,
            description: c.description,
            projectType: c.phase,
            items,
            status: 'PUBLISHED',
          },
        });
      }
    }
    this.canonicalChecklistsEnsured = true;
  }

  async createChecklist(input: CreateConstructionChecklistInput, actorId: string) {
    const baseSlug = input.slug ?? slugifyTitle(input.title);
    let slug = baseSlug;
    let n = 1;
    while (await this.db.constructionChecklist.findFirst({ where: { slug, deletedAt: null } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const items = normalizeChecklistItems(input.items, input.projectType);
    const row = await this.db.constructionChecklist.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        projectType: input.projectType,
        items,
        status: input.status ?? 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await this.audit(
      actorId,
      'construction.checklist.create',
      'construction_checklist',
      row.id,
      row,
    );
    return row;
  }

  async updateChecklist(id: string, input: UpdateConstructionChecklistInput, actorId: string) {
    const existing = await this.db.constructionChecklist.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw this.notFound('Checklist not found.');
    const row = await this.db.constructionChecklist.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.slug != null ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.projectType !== undefined ? { projectType: input.projectType } : {}),
        ...(input.items !== undefined
          ? {
              items: normalizeChecklistItems(
                input.items,
                input.projectType ?? existing.projectType,
              ),
            }
          : {}),
        ...(input.status != null ? { status: input.status } : {}),
        updatedBy: actorId,
      },
    });
    await this.audit(actorId, 'construction.checklist.update', 'construction_checklist', id, row);
    return row;
  }

  async listProjectChecklistProgress(projectId: string, userId?: string | null, admin = false) {
    await this.assertProjectAccess(projectId, userId, admin);
    const rows = await this.db.constructionProjectChecklistProgress.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      checklistId: r.checklistId,
      checklistSlug: r.checklistSlug,
      items: (r.items ?? {}) as Record<string, unknown>,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getProjectChecklistProgress(
    projectId: string,
    checklistSlug: string,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    const checklist = await this.getChecklist(checklistSlug);
    const row = await this.db.constructionProjectChecklistProgress.findFirst({
      where: { projectId, checklistSlug, deletedAt: null },
    });
    const progress = (row?.items ?? {}) as Record<
      string,
      { completed?: boolean; notes?: string | null; completedAt?: string | null }
    >;
    return {
      projectId,
      checklistSlug,
      checklistId: row?.checklistId ?? checklist.id,
      checklistTitle: checklist.title,
      items: progress,
      summary: summarizeChecklistProgress({ items: checklist.items, progress }),
      qualification: CONSTRUCTION_CHECKLIST_QUALIFICATION,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  }

  async saveProjectChecklistProgress(
    projectId: string,
    raw: SaveConstructionChecklistProgressInput,
    userId?: string | null,
    admin = false,
  ) {
    await this.assertProjectAccess(projectId, userId, admin);
    const input = saveConstructionChecklistProgressSchema.parse(raw);
    const checklist = await this.getChecklist(input.checklistSlug);

    const existing = await this.db.constructionProjectChecklistProgress.findFirst({
      where: { projectId, checklistSlug: input.checklistSlug, deletedAt: null },
    });

    const prev = (existing?.items ?? {}) as Record<
      string,
      { completed?: boolean; notes?: string | null; completedAt?: string | null }
    >;
    const next: typeof prev = { ...prev };
    for (const [itemId, entry] of Object.entries(input.items)) {
      const completed = Boolean(entry.completed);
      next[itemId] = {
        completed,
        notes: entry.notes ?? null,
        completedAt: completed
          ? (entry.completedAt ?? prev[itemId]?.completedAt ?? new Date().toISOString())
          : null,
      };
    }

    const data = {
      checklistId: checklist.id,
      items: next as object,
      deletedAt: null,
    };

    const row = existing
      ? await this.db.constructionProjectChecklistProgress.update({
          where: { id: existing.id },
          data,
        })
      : await this.db.constructionProjectChecklistProgress.create({
          data: {
            projectId,
            checklistSlug: input.checklistSlug,
            ...data,
          },
        });

    return {
      id: row.id,
      projectId,
      checklistSlug: input.checklistSlug,
      checklistId: row.checklistId,
      items: next,
      summary: summarizeChecklistProgress({ items: checklist.items, progress: next }),
      qualification: CONSTRUCTION_CHECKLIST_QUALIFICATION,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteChecklist(id: string, actorId: string) {
    const existing = await this.db.constructionChecklist.findFirst({
      where: { id, deletedAt: null },
    });
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
    await this.audit(
      actorId,
      'construction.comparison.create',
      'construction_comparison',
      row.id,
      row,
    );
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
        where: { slug: { in: [...SUPPLIER_DIRECTORY_SLUGS] }, deletedAt: null },
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

  private serializeSupplierCard(b: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    verificationStatus?: string;
    sponsored?: boolean;
    featured?: boolean;
    updatedAt: Date;
    locations?: Array<{ city?: string | null; state?: string | null; locality?: string | null }>;
    categories?: Array<{ category?: { name: string; slug: string } | null }>;
    products?: Array<{ name: string }>;
    metadata?: unknown;
  }) {
    const dirSlugs = (b.categories ?? [])
      .map((c) => c.category?.slug)
      .filter((s): s is string => Boolean(s));
    const categoryKeys = inferSupplierCategoriesFromDirectorySlugs(dirSlugs);
    const meta = (b.metadata ?? {}) as Record<string, unknown>;
    const metaBrands = Array.isArray(meta.brands)
      ? meta.brands.filter((x): x is string => typeof x === 'string')
      : [];
    const productBrands = (b.products ?? []).map((p) => p.name).slice(0, 12);
    const brands = Array.from(new Set([...metaBrands, ...productBrands])).slice(0, 20);
    const verify = verificationDisplay(b.verificationStatus);
    const city = b.locations?.[0]?.city ?? null;

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      href: supplierProfilePath(b.slug),
      description: b.description ?? null,
      categories: categoryKeys.map((key) => {
        const cat = getSupplierDirectoryCategory(key)!;
        return { key: cat.key, label: cat.label };
      }),
      categoryLabels: categoryKeys.map((k) => getSupplierDirectoryCategory(k)!.label),
      location: {
        city,
        state: b.locations?.[0]?.state ?? null,
        locality: b.locations?.[0]?.locality ?? null,
      },
      contact: {
        phone: b.phone ?? null,
        email: b.email ?? null,
        whatsapp: b.whatsapp ?? null,
        website: b.website ?? null,
      },
      brands,
      verificationStatus: b.verificationStatus ?? 'UNVERIFIED',
      verificationLabel: verify.label,
      verified: verify.verified,
      sponsored: Boolean(b.sponsored),
      featured: Boolean(b.featured),
      lastUpdated: b.updatedAt.toISOString(),
    };
  }

  getSupplierDirectoryMeta() {
    return {
      version: SUPPLIER_DIRECTORY_VERSION,
      qualification: SUPPLIER_DIRECTORY_QUALIFICATION,
      categories: SUPPLIER_DIRECTORY_CATEGORIES.map((c) => ({
        key: c.key,
        label: c.label,
      })),
      cities: SUPPLIER_DIRECTORY_CITIES.map((c) => ({ slug: c.slug, name: c.name })),
      sortOptions: SUPPLIER_SORT_OPTIONS,
      defaultSort: SUPPLIER_DEFAULT_SORT,
      neverRanksBest: true,
      sponsoredMustBeLabelled: true,
    };
  }

  async listSuppliers(raw: Partial<SupplierDirectoryQuery> = {}) {
    const query = supplierDirectoryQuerySchema.parse(raw);
    const slugs = directorySlugsForCategory(
      query.category && isSupplierDirectoryCategoryKey(query.category) ? query.category : null,
    );

    const cityName =
      query.location &&
      (SUPPLIER_DIRECTORY_CITIES.find((c) => c.slug === query.location)?.name ?? query.location);

    // Fetch a page via directory repo; filter to construction supplier slugs in memory for multi-slug OR.
    // Sort is name|recent only — never boost sponsored (no deceptive ranking).
    const page = await this.repos.businesses.list({
      status: 'APPROVED',
      city: cityName || undefined,
      verified: query.verified === true ? true : undefined,
      sort: query.sort === 'recent' ? 'recent' : 'name',
      limit: Math.min(query.limit * 3, 150),
      cursor: query.cursor ?? undefined,
    });

    const brandNeedle = query.brand?.trim().toLowerCase() ?? '';

    let items = (
      page.items as unknown as Array<Parameters<ConstructionService['serializeSupplierCard']>[0]>
    ).filter((b) => {
      const dirSlugs = (b.categories ?? [])
        .map((c) => c.category?.slug)
        .filter((s): s is string => Boolean(s));
      if (!dirSlugs.some((s) => slugs.includes(s))) return false;
      if (query.category && isSupplierDirectoryCategoryKey(query.category)) {
        const keys = inferSupplierCategoriesFromDirectorySlugs(dirSlugs);
        if (query.category !== 'other' && !keys.includes(query.category)) {
          // Allow building-materials businesses to appear under specific categories when tagged only broadly
          if (!dirSlugs.includes('building-materials')) return false;
        }
      }
      if (brandNeedle) {
        const meta = (b.metadata ?? {}) as Record<string, unknown>;
        const metaBrands = Array.isArray(meta.brands)
          ? meta.brands.filter((x): x is string => typeof x === 'string')
          : [];
        const productNames = (b.products ?? []).map((p) => p.name);
        const hay = [...metaBrands, ...productNames, b.name, b.description ?? '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(brandNeedle)) return false;
      }
      return true;
    });

    // Ensure products are available for brand filter — list include may omit products.
    // Re-fetch thin set if needed: for now re-query with prisma include products for filtered ids.
    if (items.length && !('products' in (page.items[0] ?? {}))) {
      const ids = items.map((i) => i.id);
      const withProducts = await this.db.business.findMany({
        where: { id: { in: ids }, deletedAt: null },
        include: {
          locations: { where: { deletedAt: null }, take: 3 },
          categories: { include: { category: true } },
          products: { where: { deletedAt: null }, take: 20 },
        },
      });
      const byId = new Map(withProducts.map((r) => [r.id, r]));
      items = items.map((i) => byId.get(i.id) ?? i).filter(Boolean) as typeof items;
      if (brandNeedle) {
        items = items.filter((b) => {
          const meta = (b.metadata ?? {}) as Record<string, unknown>;
          const metaBrands = Array.isArray(meta.brands)
            ? meta.brands.filter((x): x is string => typeof x === 'string')
            : [];
          const productNames = (b.products ?? []).map((p) => p.name);
          const hay = [...metaBrands, ...productNames, b.name, b.description ?? '']
            .join(' ')
            .toLowerCase();
          return hay.includes(brandNeedle);
        });
      }
    }

    const limit = query.limit;
    const pageItems = items.slice(0, limit);
    const hasMore = items.length > limit || page.hasMore;

    // Stable non-deceptive order: name asc unless recent
    pageItems.sort((a, b) => {
      if (query.sort === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    const sponsoredSeparately = pageItems.filter((b) => b.sponsored);
    const organic = pageItems.filter((b) => !b.sponsored);

    return {
      version: SUPPLIER_DIRECTORY_VERSION,
      qualification: SUPPLIER_DIRECTORY_QUALIFICATION,
      filters: {
        location: query.location ?? null,
        category: query.category ?? null,
        brand: query.brand ?? null,
        verified: query.verified ?? null,
        sort: query.sort,
      },
      categories: SUPPLIER_DIRECTORY_CATEGORIES.map((c) => ({
        key: c.key,
        label: c.label,
        href: `/construction/suppliers?category=${c.key}`,
      })),
      cities: SUPPLIER_DIRECTORY_CITIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        href: `/construction/suppliers?location=${c.slug}`,
      })),
      /** Clearly labelled sponsored strip — not mixed into “best” ranking. */
      sponsoredListings: sponsoredSeparately.map((b) => this.serializeSupplierCard(b)),
      listings: organic.map((b) => this.serializeSupplierCard(b)),
      /** Flat list for clients that want a single array (organic first, then sponsored labelled). */
      businesses: [
        ...organic.map((b) => this.serializeSupplierCard(b)),
        ...sponsoredSeparately.map((b) => this.serializeSupplierCard(b)),
      ],
      meta: {
        hasMore,
        nextCursor: page.nextCursor ?? null,
        limit,
        count: organic.length + sponsoredSeparately.length,
        rankingNote: 'Sorted by name or last updated — not by quality score or paid boost.',
      },
      directoryHref: '/directory?vertical=construction',
    };
  }

  /** @deprecated Prefer listSuppliers — kept for admin summary callers expecting { businesses }. */
  async suppliers(params: { limit?: number; cursor?: string } = {}) {
    return this.listSuppliers({
      limit: params.limit ?? 48,
      cursor: params.cursor,
      sort: 'name',
    });
  }

  async getSupplierProfile(slug: string) {
    const row = await this.repos.businesses.findBySlug(slug);
    if (!row || row.status !== 'APPROVED') {
      return null;
    }
    const dirSlugs = (row.categories ?? [])
      .map((c) => c.category?.slug)
      .filter((s): s is string => Boolean(s));
    if (!dirSlugs.some((s) => SUPPLIER_DIRECTORY_SLUGS.includes(s))) {
      return null;
    }

    const card = this.serializeSupplierCard({
      ...row,
      products: row.products ?? [],
    });
    const hours = formatBusinessHours(
      (row.hours ?? []).map((h) => ({
        day: h.day,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      })),
    );

    return {
      ...card,
      businessName: row.name,
      hours,
      hoursAvailable: hours.length > 0,
      services: (row.services ?? []).map((s) => ({
        name: s.name,
        description: s.description,
      })),
      products: (row.products ?? []).map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
      })),
      qualification: SUPPLIER_DIRECTORY_QUALIFICATION,
      neverRankedBest: true,
    };
  }

  async getSupplierLanding(categoryKey: string, citySlug: string) {
    if (!isSupplierDirectoryCategoryKey(categoryKey)) return null;
    const city = SUPPLIER_DIRECTORY_CITIES.find((c) => c.slug === citySlug);
    if (!city) return null;

    const result = await this.listSuppliers({
      category: categoryKey,
      location: citySlug,
      sort: 'name',
      limit: 100,
    });

    const listings = result.businesses;
    const indexable = canIndexSupplierLanding({
      categoryKey,
      citySlug,
      listings: listings.map((l) => ({
        description: l.description,
        status: 'APPROVED',
        city: l.location.city,
      })),
    });

    if (!indexable) return null;

    const cat = getSupplierDirectoryCategory(categoryKey)!;
    return {
      category: { key: cat.key, label: cat.label },
      city: { slug: city.slug, name: city.name },
      canonicalPath: supplierLandingPath(categoryKey, citySlug),
      indexable: true,
      listings,
      sponsoredListings: result.sponsoredListings,
      qualification: SUPPLIER_DIRECTORY_QUALIFICATION,
      sampleSize: listings.length,
      lastUpdated:
        listings
          .map((l) => l.lastUpdated)
          .sort()
          .reverse()[0] ?? null,
    };
  }

  async listIndexableSupplierLandings() {
    const pairs: Array<{ category: string; city: string; path: string }> = [];
    for (const cat of SUPPLIER_DIRECTORY_CATEGORIES) {
      if (cat.key === 'other') continue;
      for (const city of SUPPLIER_DIRECTORY_CITIES) {
        const landing = await this.getSupplierLanding(cat.key, city.slug);
        if (landing) {
          pairs.push({
            category: cat.key,
            city: city.slug,
            path: landing.canonicalPath,
          });
        }
      }
    }
    return { pairs };
  }

  private serializeProfessionalCard(b: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    verificationStatus?: string;
    sponsored?: boolean;
    featured?: boolean;
    updatedAt: Date;
    locations?: Array<{ city?: string | null; state?: string | null; locality?: string | null }>;
    categories?: Array<{ category?: { name: string; slug: string } | null }>;
    services?: Array<{ name: string; description?: string | null }>;
    metadata?: unknown;
  }) {
    const dirSlugs = (b.categories ?? [])
      .map((c) => c.category?.slug)
      .filter((s): s is string => Boolean(s));
    const typeKeys = inferProfessionalTypesFromDirectorySlugs(dirSlugs);
    const meta = parseProfessionalMetadata(b.metadata);
    const verify = verificationDisplay(b.verificationStatus);
    const city = b.locations?.[0]?.city ?? null;
    const sourceBadges = listingSourceBadges({
      verificationStatus: b.verificationStatus,
      sponsored: Boolean(b.sponsored),
    });

    return {
      id: b.id,
      name: b.name,
      businessName: b.name,
      slug: b.slug,
      href: professionalProfilePath(b.slug),
      description: b.description ?? null,
      professionalTypes: typeKeys.map((key) => {
        const t = getProfessionalType(key)!;
        return { key: t.key, label: t.label };
      }),
      professionalTypeLabels: typeKeys.map((k) => getProfessionalType(k)!.label),
      location: {
        city,
        state: b.locations?.[0]?.state ?? null,
        locality: b.locations?.[0]?.locality ?? null,
      },
      experienceYears: meta.experienceYears ?? null,
      specialities: meta.specialities ?? [],
      projectTypes: meta.projectTypes ?? [],
      serviceArea: meta.serviceArea ?? null,
      portfolio: meta.portfolio ?? [],
      contact: {
        phone: b.phone ?? null,
        email: b.email ?? null,
        whatsapp: b.whatsapp ?? null,
        website: b.website ?? null,
      },
      verificationStatus: b.verificationStatus ?? 'UNVERIFIED',
      verificationLabel: verify.label,
      verified: verify.verified,
      /** Explicit: verified ≠ Varnarc professional certification. */
      verificationNote:
        'Verified means the listing passed Varnarc’s verification program. It is not a professional licence or Varnarc certification of qualifications.',
      sponsored: Boolean(b.sponsored),
      featured: Boolean(b.featured),
      sourceBadges,
      /** Reviews are not part of this architecture yet — reserved for a future feature. */
      userReviews: null as null,
      userReviewsAvailable: false,
      lastUpdated: b.updatedAt.toISOString(),
    };
  }

  getProfessionalsDirectoryMeta() {
    return {
      version: PROFESSIONALS_DIRECTORY_VERSION,
      qualification: PROFESSIONALS_DIRECTORY_QUALIFICATION,
      types: PROFESSIONAL_TYPES.map((t) => ({
        key: t.key,
        label: t.label,
        pluralLabel: t.pluralLabel,
      })),
      specialities: PROFESSIONAL_SPECIALITIES,
      projectTypes: PROFESSIONAL_PROJECT_TYPES,
      cities: PROFESSIONALS_DIRECTORY_CITIES.map((c) => ({ slug: c.slug, name: c.name })),
      sortOptions: PROFESSIONAL_SORT_OPTIONS,
      defaultSort: PROFESSIONAL_DEFAULT_SORT,
      infoSources: PROFESSIONAL_INFO_SOURCES,
      neverRanksBest: true,
      sponsoredMustBeLabelled: true,
      reviewsNotYetAvailable: true,
      certificationClaimForbidden: true,
    };
  }

  async listProfessionals(raw: Partial<ProfessionalsDirectoryQuery> = {}) {
    const query = professionalsDirectoryQuerySchema.parse(raw);
    const slugs = directorySlugsForProfessionalType(
      query.type && isProfessionalTypeKey(query.type) ? query.type : null,
    );

    const cityName =
      query.location &&
      (PROFESSIONALS_DIRECTORY_CITIES.find((c) => c.slug === query.location)?.name ??
        query.location);

    const page = await this.repos.businesses.list({
      status: 'APPROVED',
      city: cityName || undefined,
      verified: query.verified === true ? true : undefined,
      sort: query.sort === 'recent' ? 'recent' : 'name',
      limit: Math.min(query.limit * 3, 150),
      cursor: query.cursor ?? undefined,
    });

    const specialityNeedle = query.speciality?.trim().toLowerCase() ?? '';
    const projectTypeNeedle = query.projectType?.trim().toLowerCase() ?? '';

    const items = (
      page.items as unknown as Array<
        Parameters<ConstructionService['serializeProfessionalCard']>[0]
      >
    ).filter((b) => {
      const dirSlugs = (b.categories ?? [])
        .map((c) => c.category?.slug)
        .filter((s): s is string => Boolean(s));
      if (!dirSlugs.some((s) => slugs.includes(s))) return false;
      if (query.type && isProfessionalTypeKey(query.type)) {
        const keys = inferProfessionalTypesFromDirectorySlugs(dirSlugs);
        if (!keys.includes(query.type)) return false;
      }
      const meta = parseProfessionalMetadata(b.metadata);
      const serviceHay = (b.services ?? [])
        .map((s) => `${s.name} ${s.description ?? ''}`)
        .join(' ')
        .toLowerCase();
      if (specialityNeedle) {
        const hay = [...(meta.specialities ?? []), serviceHay, b.description ?? '', b.name]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(specialityNeedle)) return false;
      }
      if (projectTypeNeedle) {
        const hay = [...(meta.projectTypes ?? []), serviceHay, b.description ?? '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(projectTypeNeedle)) return false;
      }
      return true;
    });

    const limit = query.limit;
    const pageItems = items.slice(0, limit);
    const hasMore = items.length > limit || page.hasMore;

    pageItems.sort((a, b) => {
      if (query.sort === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    const sponsoredSeparately = pageItems.filter((b) => b.sponsored);
    const organic = pageItems.filter((b) => !b.sponsored);

    return {
      version: PROFESSIONALS_DIRECTORY_VERSION,
      qualification: PROFESSIONALS_DIRECTORY_QUALIFICATION,
      filters: {
        location: query.location ?? null,
        type: query.type ?? null,
        speciality: query.speciality ?? null,
        projectType: query.projectType ?? null,
        verified: query.verified ?? null,
        sort: query.sort,
      },
      types: PROFESSIONAL_TYPES.map((t) => ({
        key: t.key,
        label: t.label,
        pluralLabel: t.pluralLabel,
        href: `/construction/professionals?type=${t.key}`,
      })),
      specialities: PROFESSIONAL_SPECIALITIES.map((s) => ({
        ...s,
        href: `/construction/professionals?speciality=${s.key}`,
      })),
      projectTypes: PROFESSIONAL_PROJECT_TYPES.map((p) => ({
        ...p,
        href: `/construction/professionals?projectType=${p.key}`,
      })),
      cities: PROFESSIONALS_DIRECTORY_CITIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        href: `/construction/professionals?location=${c.slug}`,
      })),
      infoSources: PROFESSIONAL_INFO_SOURCES,
      sponsoredListings: sponsoredSeparately.map((b) => this.serializeProfessionalCard(b)),
      listings: organic.map((b) => this.serializeProfessionalCard(b)),
      professionals: [
        ...organic.map((b) => this.serializeProfessionalCard(b)),
        ...sponsoredSeparately.map((b) => this.serializeProfessionalCard(b)),
      ],
      meta: {
        hasMore,
        nextCursor: page.nextCursor ?? null,
        limit,
        count: organic.length + sponsoredSeparately.length,
        rankingNote: 'Sorted by name or last updated — not by quality score or paid boost.',
        reviewsNote:
          'User reviews are not available yet and will be shown separately from verification.',
      },
      directoryHref: '/directory?vertical=construction',
      suppliersHref: '/construction/suppliers',
    };
  }

  async getProfessionalProfile(slug: string) {
    const row = await this.repos.businesses.findBySlug(slug);
    if (!row || row.status !== 'APPROVED') {
      return null;
    }
    const dirSlugs = (row.categories ?? [])
      .map((c) => c.category?.slug)
      .filter((s): s is string => Boolean(s));
    if (!dirSlugs.some((s) => PROFESSIONAL_DIRECTORY_SLUGS.includes(s))) {
      return null;
    }

    const card = this.serializeProfessionalCard({
      ...row,
      services: row.services ?? [],
    });

    return {
      ...card,
      services: (row.services ?? []).map((s) => ({
        name: s.name,
        description: s.description,
      })),
      qualification: PROFESSIONALS_DIRECTORY_QUALIFICATION,
      neverRankedBest: true,
      infoSources: PROFESSIONAL_INFO_SOURCES,
      structuredDataEligible: Boolean(card.location.city && card.name && card.href),
    };
  }

  async getProfessionalLanding(typeKey: string, citySlug: string) {
    if (!isProfessionalTypeKey(typeKey)) return null;
    const city = PROFESSIONALS_DIRECTORY_CITIES.find((c) => c.slug === citySlug);
    if (!city) return null;

    const result = await this.listProfessionals({
      type: typeKey,
      location: citySlug,
      sort: 'name',
      limit: 100,
    });

    const listings = result.professionals;
    const indexable = canIndexProfessionalLanding({
      typeKey,
      citySlug,
      listings: listings.map((l) => ({
        description: l.description,
        status: 'APPROVED',
      })),
    });

    if (!indexable) return null;

    const type = getProfessionalType(typeKey)!;
    return {
      type: { key: type.key, label: type.label, pluralLabel: type.pluralLabel },
      city: { slug: city.slug, name: city.name },
      canonicalPath: professionalLandingPath(typeKey, citySlug),
      indexable: true,
      listings,
      sponsoredListings: result.sponsoredListings,
      qualification: PROFESSIONALS_DIRECTORY_QUALIFICATION,
      sampleSize: listings.length,
      lastUpdated:
        listings
          .map((l) => l.lastUpdated)
          .sort()
          .reverse()[0] ?? null,
    };
  }

  async listIndexableProfessionalLandings() {
    const pairs: Array<{ type: string; city: string; path: string }> = [];
    for (const t of PROFESSIONAL_TYPES) {
      for (const city of PROFESSIONALS_DIRECTORY_CITIES) {
        const landing = await this.getProfessionalLanding(t.key, city.slug);
        if (landing) {
          pairs.push({
            type: t.key,
            city: city.slug,
            path: landing.canonicalPath,
          });
        }
      }
    }
    return { pairs };
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
      return [
        'id,name,slug,website,status,featured',
        ...rows.map((r) =>
          [r.id, r.name, r.slug, r.website, r.status, r.featured].map(esc).join(','),
        ),
      ].join('\n');
    }
    if (entity === 'cost-templates') {
      const rows = await this.db.costTemplate.findMany({ where: { deletedAt: null } });
      return [
        'id,name,slug,category,status',
        ...rows.map((r) => [r.id, r.name, r.slug, r.category, r.status].map(esc).join(',')),
      ].join('\n');
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
    throw new BadRequestException({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Unknown entity.' },
    });
  }

  async importCsv(entity: string, csvText: string, actorId: string) {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2)
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Empty CSV.' },
      });
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
          update: {
            name: row.name,
            website: row.website || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            website: row.website || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'materials') {
      for (const row of rows) {
        if (!row.name || !row.slug || !row.unit) continue;
        const categoryId = row.categorySlug
          ? ((
              await this.db.constructionCategory.findFirst({
                where: { slug: row.categorySlug, deletedAt: null },
                select: { id: true },
              })
            )?.id ?? null)
          : row.categoryId || null;
        const brandId = row.brandSlug
          ? ((
              await this.db.constructionBrand.findFirst({
                where: { slug: row.brandSlug, deletedAt: null },
                select: { id: true },
              })
            )?.id ?? null)
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
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Import for ${entity} not supported yet.` },
      });
    }
    await this.bust();
    return { imported };
  }
}
