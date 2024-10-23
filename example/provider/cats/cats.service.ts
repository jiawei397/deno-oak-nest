import { Inject, Injectable } from "@nest/core";
import { Cat } from "./cats.interface.ts";
import { LogService } from "./log.service.ts";
import { type Connection } from "../connection.ts";

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(
    @Inject("CONNECTION") connection: Connection,
    private readonly logService: LogService,
  ) {
    console.log("connection", connection);
  }

  findAll(): Cat[] {
    this.logService.info("findAll");
    return this.cats;
  }
}
