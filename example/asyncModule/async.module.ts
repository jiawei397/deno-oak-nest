import { Module } from "../../mod.ts";
import { AsyncFactory } from "./async.factory.ts";
import { AsyncService } from "./async.service.ts";

@Module({
  imports: [AsyncFactory.register("localhost:4878")],
  controllers: [],
  providers: [
    {
      provide: "CONNECTION_ASYNC",
      useFactory: () => { // can be async
        return Promise.resolve(AsyncFactory.connected);
      },
    },
    AsyncService,
  ],
})
export class AsyncModule {
}
