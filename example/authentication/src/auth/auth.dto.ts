import { IsString, MaxLength, MinLength } from "class_validator";

export class SignInDto {
  @MaxLength(20)
  @MinLength(1)
  @IsString()
  username: string;

  @MaxLength(20)
  @MinLength(1)
  @IsString()
  password: string;
}
