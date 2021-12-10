import { Max, Min } from "../../deps.ts";

export class RoleInfoDto {
  @Max(2)
  @Min(1)
  pageNum!: number;

  @Max(5)
  @Min(1)
  pageCount!: number;
}
