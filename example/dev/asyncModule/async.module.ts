import { type DynamicModule, Module } from "@nest/core";
import { ASYNC_KEY } from "./async.constant.ts";
import { AsyncService } from "./async.service.ts";

@Module({})
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
      exports: [AsyncService],
    };
  }
}
