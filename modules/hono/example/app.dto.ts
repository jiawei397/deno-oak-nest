import { Property } from "@nest";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
} from "class_validator";

export class SaveDto {
  @Max(2)
  @Min(1)
  pageNum: number;

  @Max(5)
  @Min(1)
  pageCount: number;

  @MinLength(2)
  content: string;
}

export class QueryDto {
  @Property() // If this class is used for not Post Body, and you want to validate bool、number or , you must add this decorator.
  @IsBoolean()
  sex: boolean;

  @Property()
  @IsNumber()
  age: number;

  @IsArray()
  @IsString({ each: true })
  @Property()
  keys: string[];
}

export class QueryWithoutPropDto {
  @IsBoolean()
  sex: boolean;

  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
