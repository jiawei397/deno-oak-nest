# oak_nest_postgres_module

This is a Postgres module for [`deno_nest`](https://deno.land/x/deno_nest).
Currently used Postgres client is <https://deno.land/x/postgres@v0.17.0/mod.ts>
which the docs is <https://deno-postgres.com/>.

If you want to use another Postgres client, you can refer to the code for this
module, there are not many lines.

## example

Add import map in `deno.json`:

```json
{
  "imports": {
    "@nest": "https://deno.land/x/deno_nest@v3.1.1/mod.ts",
    "@nest/hono": "https://deno.land/x/deno_nest@v3.1.1/modules/hono/mod.ts",
    "@nest/postgres": "https://deno.land/x/deno_nest@v3.1.1/modules/postgres/mod.ts"
  }
}
```

Then `app.modules.ts`:

```typescript
import { Module } from "@nest";
import { PostgresModule } from "@nest/postgres";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    PostgresModule.forRoot({
      hostname: "localhost",
      port: "5432",
      user: "root",
      database: "database", // You must ensure that the database exists, and the program will not automatically create it
      password: "yourpassword", // One thing that must be taken into consideration is that passwords contained inside the URL must be properly encoded in order to be passed down to the database. You can achieve that by using the JavaScript API encodeURIComponent and passing your password as an argument.
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Then can be used in AppController:

```ts
import { Controller, Get, Inject, Query } from "@nest";
import { Client, POSTGRES_KEY } from "@nest/postgres";

@Controller("")
export class AppController {
  constructor(@Inject(POSTGRES_KEY) private readonly client: Client) {}

  @Get("/createCompanyTable")
  async createCompanyTable() {
    await this.client.queryArray(`DROP TABLE IF EXISTS COMPANY`);
    const result = await this.client.queryObject(`
      CREATE TABLE COMPANY(
        ID INT PRIMARY KEY     NOT NULL,
        NAME           TEXT    NOT NULL,
        AGE            INT     NOT NULL,
        ADDRESS        CHAR(50),
        SALARY         REAL
    );
    `);
    return result;
  }

  @Get("/createCompany")
  async createCompany(
    @Query("username") username: string,
    @Query("id") id: number,
  ) {
    const result = await this.client.queryObject(
      `INSERT INTO COMPANY (ID,NAME,AGE,ADDRESS,SALARY) VALUES (${id}, '${username}', 32, 'California', 20000.00)`,
    );
    console.log(result);
    return result;
  }

  @Get("/updateCompany")
  async updateCompany(@Query("id") id: number) {
    console.info("Updating company " + id);
    const result = await this.client.queryArray(
      `UPDATE COMPANY SET SALARY = 15000 WHERE ID = ${id}`,
    );
    console.log(result);
    return result.rowCount;
  }
}
```

More can see the example dir.
