import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  contactMessageListQuerySchema,
  createContactMessageSchema,
  updateContactMessageStatusSchema,
  type ContactMessageListQuery,
  type CreateContactMessageInput,
  type UpdateContactMessageStatusInput,
} from '@varnarc/validation';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { ContactService } from './contact.service';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Public()
  @Post()
  async submit(
    @Body(new ZodValidationPipe(createContactMessageSchema)) body: CreateContactMessageInput,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.service.submit(body, { ip, userAgent });
    if (!result.ok) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: result.error || 'send_failed',
            message: result.message || "We couldn't send your message. Please try again.",
          },
          data: { id: result.id, stored: result.stored },
        },
        result.error === 'undeliverable' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY,
      );
    }
    return ok(result);
  }

  @Get('messages')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async list(
    @Query(new ZodValidationPipe(contactMessageListQuerySchema)) query: ContactMessageListQuery,
  ) {
    return okCursor(await this.service.list(query));
  }

  @Get('messages/:id')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Put('messages/:id/status')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateContactMessageStatusSchema))
    body: UpdateContactMessageStatusInput,
  ) {
    return ok(await this.service.updateStatus(id, body));
  }
}
