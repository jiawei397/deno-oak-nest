import { Injectable } from "@nest";
import { TestService } from "./test.service.ts";

@Injectable()
export class Test2Service {
  constructor(private readonly testService: TestService) {
  }
}
