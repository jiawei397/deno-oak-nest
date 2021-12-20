import { Module } from "./deps.ts";
import { AppController } from "./app.controller.ts";
import { ElasticsearchModule } from "../mod.ts";

@Module({
  imports: [
    ElasticsearchModule.forRoot({
      db: "http://elastic:369258@192.168.21.176:9200",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
