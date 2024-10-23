import { Injectable } from "@nest/core";

@Injectable()
export class AppService {
  hello() {
    return "Hello World!";
  }
}
