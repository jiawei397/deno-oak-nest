import {
  CanActivate,
  Context,
  getMetadataForGuard,
  Injectable,
  Reflector,
  UnauthorizedException,
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
    console.log("--AuthGuard---", await this.roleService.info());
    console.log("roles", getMetadataForGuard<string[]>("roles", context));
    console.log(
      "roles get by reflector",
      this.reflector.get<string[]>("roles", context),
    );
    await delay(10);
    // throw new UnauthorizedException("Unauthorized");
    // throw new ForbiddenException("this is AuthGuard error message");
    return true;
    // return false;
  }
}
