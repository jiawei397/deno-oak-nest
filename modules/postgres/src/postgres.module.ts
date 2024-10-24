import { type DynamicModule, Module, red, yellow } from "@nest/core";
import { Client, type ClientOptions, type ConnectionString } from "../deps.ts";
import { POSTGRES_KEY } from "./postgres.constant.ts";

@Module({})
export class PostgresModule {
  static client: Client;

  static forRoot(config: ClientOptions | ConnectionString): DynamicModule {
    return {
      module: PostgresModule,
      providers: [
        {
          provide: POSTGRES_KEY,
          useFactory: async () => { // can be async
            try {
              const client = new Client(config);
              await client.connect();
              const url = typeof config === "string"
                ? config
                : `hostname: ${config.hostname}, username: ${config.user}, database: ${config.database}`;
              console.info("connect to postgres success", yellow(url));
              this.client = client;
              return client;
            } catch (e) {
              console.error(
                "connect to postgres error",
                red((e as Error).stack || e as string),
              );
            }
          },
        },
      ],
      exports: [POSTGRES_KEY],
      global: true,
    };
  }

  static getClient() {
    return this.client;
  }
}
