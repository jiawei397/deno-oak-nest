import { IsString } from "class_validator";

export class AddUserDto {
  @IsString()
  username: string;

  @IsString()
  email: string;
}

export class UpdateUserDto {
  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  id: string;
}

export class SearchUserDto {
  @IsString()
  username: string;
}
