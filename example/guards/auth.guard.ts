import {
  CanActivate,
  Context,
  getMetadataForGuard,
  Injectable,
  Reflector,
} from "../../mod.ts";
import { delay } from "../deps.ts";
import { RoleService } from "../user/services/role.service.ts";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly roleService: RoleService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard---", this.roleService.info());
    console.log("roles", getMetadataForGuard("roles", context));
    console.log("roles get by reflector", this.reflector.get("roles", context));
    await delay(10);
    // throw new ForbiddenException("this is AuthGuard error message");
    return true;
    // return false;
  }
}
