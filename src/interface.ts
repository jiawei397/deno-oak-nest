import { Context } from "../deps.ts";

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}
