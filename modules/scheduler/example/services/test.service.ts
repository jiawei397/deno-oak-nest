import { assert, Inject, Injectable } from "@nest";

let num = 0;

@Injectable()
export class TestService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    assert(connection === "connected", 'connection is not "connected"');
    num++;
    assert(num <= 1, "init once");
  }

  info() {
    return Promise.resolve("info from TestService");
  }
}
