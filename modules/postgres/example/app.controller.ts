import { Controller, Get, Inject, Query } from "@nest/core";
import { type Client, POSTGRES_KEY } from "@nest/postgres";

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
