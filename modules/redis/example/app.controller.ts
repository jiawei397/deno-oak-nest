import { Inject, Redis } from "../deps.ts";
import { REDIS_KEY, RedisService } from "../mod.ts";
import { Controller, Get } from "./deps.ts";

@Controller("")
export class AppController {
  constructor(
    private readonly redisService: RedisService,
    @Inject(REDIS_KEY) private readonly client: Redis,
  ) {}

  @Get("/")
  async version() {
    await this.redisService.set("version", "1.0.0");
    return this.redisService.get("version");
  }

  @Get("/client")
  async useInjectedClient() {
    await this.client.lpush("userIds", "123");
    const arr = await this.client.lrange("userIds", 0, -1);
    return arr;
  }

  @Get("/service")
  async userService() {
    await this.redisService.push("userIds", {
      id: 1,
    });
    // const arr = await this.redisService.getRange("userIds", 0, 10);
    const arr = await this.redisService.client.lrange("userIds", 0, -1);
    return arr;
  }

  @Get("testSet")
  async testSet() {
    await this.client.srem("ids", 3);
    // await this.client.del("ids");
    // await this.client.sadd("ids", 5, 2, 1, 3, 4);
    const count = await this.client.scard("ids");
    const data = await this.client.smembers("ids");
    const hasNum = await this.client.sismember("ids", "5888");
    return {
      count,
      data,
      hasNum: !!hasNum,
    };
  }
}
