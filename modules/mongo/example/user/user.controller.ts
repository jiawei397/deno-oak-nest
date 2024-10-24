import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nest/core";
import type { UserService } from "./user.service.ts";
import type { AddUserDto, SearchUserDto, UpdateUserDto } from "./user.dto.ts";

@Controller("/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("add")
  add(@Body() params: AddUserDto) {
    return this.userService.save(params);
  }

  @Get("delete")
  deleteById(@Query("id") id: string) {
    if (!id) {
      throw new BadRequestException(`id is required`);
    }
    console.log(id);
    return this.userService.deleteById(id);
  }

  @Post("update")
  update(@Body() params: UpdateUserDto) {
    return this.userService.update(params.id, {
      email: params.email,
      username: params.username,
    });
  }

  @Get("query")
  query(@Query("id") id: string) {
    if (!id) {
      throw new BadRequestException(`id is required`);
    }
    console.log("id = ", id);
    return this.userService.findById(id);
  }

  @Get("list")
  list() {
    return this.userService.findAll();
  }

  @Get("syncIndex")
  syncIndex() {
    return this.userService.syncIndex();
  }

  @Post("search")
  async search(@Body() params: SearchUserDto) {
    const data = await this.userService.findByName(params.username);
    return {
      count: data.length,
      data,
    };
  }
}
