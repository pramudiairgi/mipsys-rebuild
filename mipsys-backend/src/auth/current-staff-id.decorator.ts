import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface StaffRequestUser {
  staffId?: number;
  id?: number;
}

export const CurrentStaffId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: StaffRequestUser }>();
    return request.user?.staffId ?? request.user?.id;
  }
);
