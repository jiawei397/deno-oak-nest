import { SetMetadata } from "@nest/core";

export enum RoleAction {
  read = 1,
  write = 1 << 1,
  delete = 1 << 2,
  export = 1 << 3,
}

export const Roles = (...roles: RoleAction[]) => SetMetadata("roles", roles);
