import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentStaffId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.staffId ?? request.user?.id;
  }
);
