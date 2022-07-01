import type { DynamicModule } from "../../src/interfaces/mod.ts";
import { ASYNC_KEY } from "./async.constant.ts";
import { AsyncService } from "./async.service.ts";

export class AsyncModule {
  static register(db: string): DynamicModule {
    return {
      module: AsyncModule,
      providers: [{
        provide: ASYNC_KEY,
        useFactory: () => { // can be async
          console.log("AsyncModule.register: ", db);
          return Promise.resolve(true);
        },
      }, AsyncService],
    };
  }
}
