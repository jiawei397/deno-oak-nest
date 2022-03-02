import { Property } from "../../../mod.ts";
import { Max, Min } from "../../deps.ts";

export class RoleInfoDto {
  @Max(2)
  @Min(1)
  @Property()
  pageNum!: number;

  @Max(5)
  @Min(1)
  @Property()
  pageCount!: number;

  @Property()
  sex!: boolean;
}
