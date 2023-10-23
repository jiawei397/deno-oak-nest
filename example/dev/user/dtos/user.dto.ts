import { Property } from "@nest";
import { IsEnum, IsNumber, IsString, Max } from "class_validator";

export class UploadDto {
  @Property()
  @IsString()
  name: string;

  @Property()
  @IsNumber()
  @Max(10)
  age: number;
}

enum Status {
  private,
  innner,
}

export class QueryUserInfoDto {
  @Property()
  @IsEnum(Status)
  status?: number; // cannnot set to Status when used in a GET request, because Deno now not infer the enum type to number
}
