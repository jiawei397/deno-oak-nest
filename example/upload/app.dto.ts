import { IsNumber, IsString, Max } from "class_validator";
import { Property } from "@nest";

export class UploadDto {
  @IsString()
  name: string;

  @Property()
  @IsNumber()
  @Max(10)
  age: number;

  file: File;
}
