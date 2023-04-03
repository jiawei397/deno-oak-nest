import {
  Client,
  type ClientOptions,
  type ConnectionString,
  red,
  yellow,
} from "../deps.ts";
import { POSTGRES_KEY } from "./postgres.constant.ts";

export class PostgresModule {
  static client: Client;

  static forRoot(config: ClientOptions | ConnectionString) {
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
              console.error("connect to postgres error", red(e.stack));
            }
          },
        },
      ],
    };
  }

  static getClient() {
    return this.client;
  }
}
