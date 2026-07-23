import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticleAiService } from './article-ai.service';
import { ArticleCommentsController } from './article-comments.controller';
import { ArticleCommentsService } from './article-comments.service';
import { SearchModule } from '../../search/search.module';
import { AiModule } from '../../ai/ai.module';

@Module({
  imports: [SearchModule, AiModule],
  controllers: [ArticlesController, ArticleCommentsController],
  providers: [ArticlesService, ArticleAiService, ArticleCommentsService],
  exports: [ArticlesService, ArticleCommentsService],
})
export class ArticlesModule {}
