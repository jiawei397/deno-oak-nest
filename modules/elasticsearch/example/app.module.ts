import { Module } from "@nest/core";
import { ElasticsearchModule } from "@nest/elasticsearch";
import { AppController } from "./app.controller.ts";

@Module({
  imports: [
    ElasticsearchModule.forRoot({
      db: "http://10.100.30.65:9200",
      // db: "http://elastic:369258@192.168.21.176:9200",
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
