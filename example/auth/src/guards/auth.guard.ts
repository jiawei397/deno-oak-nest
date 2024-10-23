import {
  CanActivate,
  type Context,
  ForbiddenException,
  Injectable,
  Reflector,
} from "@nest/core";
import { RoleService } from "../roles/role.service.ts";
import { RoleAction } from "../roles/role.decorator.ts";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly roleService: RoleService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: Context): Promise<boolean> {
    console.info("auth guard");
    const role = await this.roleService.getRole();
    const currentNeedActions = this.reflector.get<RoleAction[]>(
      "roles",
      context,
    );
    if (currentNeedActions) { // if has role decorator, must check role
      const valid = role.actions
        ? currentNeedActions.every((action) => role.actions!.includes(action))
        : false;
      if (!valid) {
        console.error(
          "role not valid, role:",
          role,
          ", currentActions:",
          currentNeedActions,
        );
        throw new ForbiddenException("Role not valid");
      } else {
        console.info(
          "role valid, role:",
          role,
          ", currentActions:",
          currentNeedActions,
        );
      }
    }
    context.request.states.userInfo = role;
    return true;
  }
}
