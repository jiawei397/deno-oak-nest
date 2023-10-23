import { Injectable } from "@nest";
import { Cat } from "./cats.interface.ts";

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  findAll(): Cat[] {
    return this.cats;
  }
}
