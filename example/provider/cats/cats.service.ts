import { Injectable } from "@nest";
import { Cat } from "./cats.interface.ts";
import { LogService } from "./log.service.ts";

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private logService: LogService) {
  }

  findAll(): Cat[] {
    this.logService.info("findAll");
    return this.cats;
  }
}
