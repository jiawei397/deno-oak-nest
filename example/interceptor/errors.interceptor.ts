import { type Context, Injectable, Next } from "../../mod.ts";
import type {
  NestInterceptor,
} from "../../src/interfaces/interceptor.interface.ts";
import { BadGatewayException } from "../deps.ts";
import { RoleService } from "../user/services/role.service.ts";

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  constructor(
    private readonly roleService: RoleService,
  ) {
  }

  async intercept(_context: Context, next: Next) {
    try {
      console.log(`roleService`, this.roleService.getRole());
      await next();
    } catch (err) {
      throw new BadGatewayException(err);
    }
  }
}
