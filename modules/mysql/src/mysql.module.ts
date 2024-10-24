import { type DynamicModule, Module, red, yellow } from "@nest/core";
import { Client, type ClientConfig } from "../deps.ts";
import { MYSQL_KEY } from "./mysql.constant.ts";

@Module({})
export class MysqlModule {
  static client: Client;

  static forRoot(config: ClientConfig): DynamicModule {
    return {
      module: MysqlModule,
      providers: [{
        provide: MYSQL_KEY,
        useFactory: async () => { // can be async
          try {
            const { db, ...otherConfig } = config;
            const client = new Client();
            if (db) {
              await client.connect(otherConfig);
              await client.execute(`CREATE DATABASE IF NOT EXISTS ${db}`);
              await client.execute(`USE ${db}`);
              console.info(
                "connect to mysql success",
                yellow(
                  `hostname: ${config.hostname}, username: ${config.username}, database: ${db}`,
                ),
              );
            } else {
              await client.connect(config);
              console.info(
                "connect to mysql success",
                yellow(
                  `hostname: ${config.hostname}, username: ${config.username}`,
                ),
              );
            }
            this.client = client;
            return client;
          } catch (e) {
            console.error(
              "connect to mysql error",
              red((e as Error).stack || e as string),
            );
          }
        },
      }],
      exports: [MYSQL_KEY],
      global: true,
    };
  }

  static getClient(): Client {
    return this.client;
  }
}
