import { assert, Inject, Injectable } from "@nest/core";

let num = 0;

@Injectable()
export class TestService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    assert(this.connection === "connected", 'connection is not "connected"');
    num++;
    assert(num <= 1, "init once");
  }

  info() {
    return Promise.resolve("info from TestService");
  }
}
