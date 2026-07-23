import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUser } from '@varnarc/types';

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUser }>();
    return request.user;
  },
);
