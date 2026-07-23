import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterEmailService } from './newsletter-email.service';
import { NewsletterSchedulerService } from './newsletter.scheduler';
import { NewsletterService } from './newsletter.service';

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, NewsletterEmailService, NewsletterSchedulerService],
})
export class NewsletterModule {}
