# oak_nest_mysql_module

This is a mysql module for [`oak_nest`](https://deno.land/x/oak_nest). Currently
used MySQL client is <https://deno.land/x/mysql@v2.11.0/mod.ts>.

## example

```typescript
import { Module } from "https://deno.land/x/oak_nest@v1.14.2/mod.ts";
import { AppController } from "./app.controller.ts";
import { MysqlModule } from "https://deno.land/x/oak_nest@v1.14.2/modules/mysql/mod.ts";

@Module({
  imports: [
    MysqlModule.forRoot({
      hostname: "localhost",
      username: "root",
      db: "test",
      poolSize: 3, // connection limit
      password: "yourpassword",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then can be used in AppController:

```ts
import {
  Client,
  MYSQL_KEY,
} from "https://deno.land/x/oak_nest@v1.14.2/modules/mysql/mod.ts";
import {
  Controller,
  Get,
  Inject,
  Query,
} from "https://deno.land/x/oak_nest@v1.14.2/mod.ts";

@Controller("")
export class AppController {
  constructor(@Inject(MYSQL_KEY) private readonly client: Client) {}

  @Get("/createUserTable")
  async createUserTable() {
    await this.client.execute(`DROP TABLE IF EXISTS users`);
    await this.client.execute(`
      CREATE TABLE users (
          id int(11) NOT NULL AUTO_INCREMENT,
          name varchar(100) NOT NULL,
          created_at timestamp not null default current_timestamp,
          PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    return "created";
  }

  @Get("/createUser")
  async createUser(@Query("username") username: string) {
    const result = await this.client.execute(
      `INSERT INTO users(name) values(?)`,
      [
        username,
      ],
    );
    console.log(result);
    return result;
  }

  @Get("/updateUser")
  async updateUser(@Query("id") id: number) {
    console.info("Updating user " + id);
    const result = await this.client.execute(
      `update users set ?? = ? where id = ?`,
      [
        "name",
        "MYR",
        id,
      ],
    );
    console.log(result);
    return result;
  }
}
```

More can see the example dir.
