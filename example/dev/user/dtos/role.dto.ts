import { Property } from "@nest";
import { Max, Min } from "class_validator";

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
