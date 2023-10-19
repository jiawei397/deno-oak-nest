# oak_nest_mysql_module

This is a mysql module for [`deno_nest`](https://deno.land/x/deno_nest). Currently
used MySQL client is <https://deno.land/x/mysql@v2.11.0/mod.ts>.

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.1.2/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.1.2/modules/hono/mod.ts",
    "@nest/mysql": "https://deno.land/x/deno_nest@v3.1.2/modules/mysql/mod.ts"
  }
}
```

Here is `app.module.ts`:

```typescript
import { Module } from "@nest";
import { MysqlModule } from "@nest/mysql";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    MysqlModule.forRoot({
      hostname: "localhost",
      username: "root",
      port: 3306,
      db: "test",
      poolSize: 3, // connection limit
      password: "123456",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then can be used in `AppController`:

```ts
import { Client, MYSQL_KEY } from "@nest/mysql";
import { Controller, Get, Inject, Query } from "@nest";

@Controller("")
export class AppController {
  constructor(@Inject(MYSQL_KEY) private readonly client: Client) {}

  @Get("/createUserTable")
  async createUserTable() {
    // await this.client.execute(`CREATE DATABASE IF NOT EXISTS wiki`);
    // await this.client.execute(`USE wiki`);
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
