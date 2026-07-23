import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ok } from '../../common/utils/response';
import { ExampleService } from './example.service';

@ApiTags('example')
@Controller('examples')
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.API_VIEW)
  list() {
    return ok(this.service.list());
  }
}
