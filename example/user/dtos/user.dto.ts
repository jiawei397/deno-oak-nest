import { Property } from "../../../mod.ts";
import { IsNumber, IsString, Max } from "../../deps.ts";

export class UploadDto {
  @Property()
  @IsString()
  name: string;

  @Property()
  @IsNumber()
  @Max(10)
  age: number;
}
