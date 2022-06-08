import { Property } from "../../../mod.ts";
import { IsArray, IsNumber, IsString, Max } from "../../deps.ts";

export class UploadDto {
  @Property()
  @IsString()
  name: string;

  @Property()
  @IsNumber()
  @Max(10)
  age: number;
}

export class QueryUserInfoDto {
  @IsArray()
  @IsString({ each: true })
  @Property()
  keys: string[];
}
