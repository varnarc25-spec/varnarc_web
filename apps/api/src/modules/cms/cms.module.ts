import { Module } from '@nestjs/common';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { PagesModule } from './pages/pages.module';
import { MenusModule } from './menus/menus.module';
import { CmsDashboardModule } from './dashboard/cms-dashboard.module';
import { PublishSchedulerService } from './publish-scheduler.service';

@Module({
  imports: [
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    PagesModule,
    MenusModule,
    CmsDashboardModule,
  ],
  providers: [PublishSchedulerService],
  exports: [
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    PagesModule,
    MenusModule,
    CmsDashboardModule,
  ],
})
export class CmsModule {}
