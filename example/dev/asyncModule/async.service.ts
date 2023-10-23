import { assert, Inject, Injectable } from "@nest";
import { ASYNC_KEY } from "./async.constant.ts";

@Injectable()
export class AsyncService {
  constructor(@Inject(ASYNC_KEY) private readonly connected: boolean) {
    assert(this.connected === true, "injected CONNECTION_ASYNC maybe true");
  }

  info() {
    return "info from AsyncService and the connected is: " + this.connected;
  }
}
