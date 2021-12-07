import {
  CanActivate,
  Context,
  getMetadataForGuard,
  Injectable,
} from "../../mod.ts";
import { delay } from "../deps.ts";
import { RoleService } from "../user/services/role.service.ts";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly roleService: RoleService) {}

  async canActivate(context: Context): Promise<boolean> {
    console.log("--AuthGuard---", this.roleService.info());
    console.log("roles", getMetadataForGuard("roles", context));
    await delay(10);
    // throw new ForbiddenException("this is AuthGuard error message");
    return true;
    // return false;
  }
}
