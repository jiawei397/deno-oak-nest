import { RoleAction } from "./role.decorator.ts";

export type User = {
  userId: number;
  username: string;
  actions?: RoleAction[];
};
