import { Inject, Injectable } from "../../mod.ts";

@Injectable()
export class AsyncService {
  constructor(@Inject("CONNECTION_ASYNC") private readonly connection: string) {
    console.log(
      "injected CONNECTION_ASYNC maybe true: ",
      this.connection,
      "----",
      connection,
    );
  }

  info() {
    return "info from AsyncService";
  }
}
