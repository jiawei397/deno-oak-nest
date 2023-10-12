import { Injectable } from "@nest";

@Injectable()
export class AppService {
  hello() {
    return "Hello World!";
  }
}
