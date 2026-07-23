import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateHomepageLayoutInput,
  CursorPaginationQuery,
  UpdateHomepageLayoutInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

type HomepageSections = Parameters<Repositories['homepageLayouts']['saveSections']>[1];

@Injectable()
export class HomepageService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  private mapSections(sections: CreateHomepageLayoutInput['sections']): HomepageSections {
    return sections.map((section) => ({
      name: section.name,
      sortOrder: section.sortOrder,
      settings: section.settings ?? null,
      widgets: section.widgets.map((widget) => ({
        widgetId: widget.widgetId,
        sortOrder: widget.sortOrder,
        settings: widget.settings ?? null,
      })),
    })) as HomepageSections;
  }

  list(query: CursorPaginationQuery) {
    return this.repos.homepageLayouts.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  listWidgets() {
    return this.repos.widgets.listAll();
  }

  async getDefault() {
    const layout = await this.repos.homepageLayouts.findDefault();
    if (!layout) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Homepage layout not found.' },
      });
    }
    return layout;
  }

  async getBySlug(slug: string) {
    const layout = await this.repos.homepageLayouts.findBySlug(slug);
    if (!layout) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Homepage layout not found.' },
      });
    }
    return layout;
  }

  async getById(id: string) {
    const layout = await this.repos.homepageLayouts.findById(id);
    if (!layout) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Homepage layout not found.' },
      });
    }
    return layout;
  }

  create(input: CreateHomepageLayoutInput, actorId?: string | null) {
    return this.repos.homepageLayouts.createWithSections({
      name: input.name,
      slug: input.slug,
      isDefault: input.isDefault,
      createdBy: actorId,
      sections: this.mapSections(input.sections),
    });
  }

  async update(id: string, input: UpdateHomepageLayoutInput, actorId?: string | null) {
    await this.getById(id);
    await this.repos.homepageLayouts.updateMeta(
      id,
      { name: input.name, slug: input.slug, isDefault: input.isDefault },
      actorId,
    );
    return this.repos.homepageLayouts.saveSections(id, this.mapSections(input.sections), actorId);
  }

  async publish(id: string, actorId?: string | null) {
    await this.getById(id);
    await this.repos.homepageLayouts.publish(id, actorId);
    return this.getById(id);
  }

  async setDefault(id: string, actorId?: string | null) {
    await this.getById(id);
    await this.repos.homepageLayouts.setDefault(id, actorId);
    return this.getById(id);
  }

  async remove(id: string, actorId?: string | null) {
    await this.getById(id);
    return this.repos.homepageLayouts.softDelete(id, actorId);
  }
}
