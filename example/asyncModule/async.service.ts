import { Inject, Injectable } from "../../mod.ts";
import { ASYNC_KEY } from "./async.constant.ts";

@Injectable()
export class AsyncService {
  constructor(@Inject(ASYNC_KEY) private readonly connection: string) {
    console.log(
      "injected CONNECTION_ASYNC maybe true: ",
      this.connection,
      "----",
      connection,
    );
  }

  info() {
    return "info from AsyncService and the conecction is: " + this.connection;
  }
}
