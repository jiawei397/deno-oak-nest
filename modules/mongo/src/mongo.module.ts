import { Module } from "../../../src/decorators/module.ts";
import { type DynamicModule } from "../../../src/interfaces/module.interface.ts";
import { MongoFactory } from "deno_mongo_schema";

@Module({})
export class MongoModule {
  static forRoot(db: string): DynamicModule {
    return {
      module: MongoModule,
      providers: [
        {
          provide: MongoModule,
          useFactory: () => { // can be async
            return MongoFactory.forRoot(db);
          },
        },
      ],
    };
  }
}
