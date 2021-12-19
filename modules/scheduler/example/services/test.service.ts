import { assert, Inject, Injectable } from "../../../../mod.ts";

@Injectable()
export class TestService {
  constructor(@Inject("CONNECTION") private readonly connection: string) {
    assert(connection === "connected", 'connection is not "connected"');
  }

  info() {
    return Promise.resolve("info from TestService");
  }
}
