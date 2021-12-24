// deno-lint-ignore-file no-unused-vars no-explicit-any
import { Application, assert, assertEquals } from "../../test_deps.ts";
import { Module } from "../decorators/module.ts";
import { Provider } from "../interfaces/provider.interface.ts";
import { Type } from "../interfaces/type.interface.ts";
import { Router } from "../router.ts";
import { findControllers, initProviders, NestFactory } from "./nest.factory.ts";

Deno.test("NestFactory", async () => {
  @Module({
    imports: [],
    controllers: [],
  })
  class AppModule {}

  const app = await NestFactory.create(AppModule);
  assert(app instanceof Application);
  assert(app.setGlobalPrefix);
  assert(app.routes);
  assert(app.useGlobalInterceptors);
  assert(app.use);
  assert(app.get);
  assert(app.router instanceof Router);
});

Deno.test("findControllers", async () => {
  const callStack: number[] = [];

  const controllerArr: Type<any>[] = [];
  const providerArr: Provider[] = [];
  const Controller = (): ClassDecorator => () => {};

  class ChildService {}

  @Controller()
  class ChildController {
    constructor(private readonly childService: ChildService) {}
  }

  @Module({
    imports: [],
    controllers: [
      ChildController,
    ],
  })
  class ChildModule {}

  class AppService {}

  class SchedulerService {
    onModuleInit() {
      callStack.push(1);
    }
  }

  @Controller()
  class AppController {
    constructor(private readonly appService: AppService) {}
  }

  @Module({
    imports: [ChildModule],
    controllers: [
      AppController,
    ],
    providers: [SchedulerService],
  })
  class AppModule {}

  await findControllers(
    AppModule,
    controllerArr,
    providerArr,
  );

  assertEquals(controllerArr.length, 2);
  assertEquals(controllerArr[0], AppController);
  assertEquals(controllerArr[1], ChildController);

  assertEquals(providerArr.length, 1);
  assertEquals(providerArr[0], SchedulerService);

  await initProviders(providerArr);
  assertEquals(callStack, [1]);

  await initProviders(providerArr);
  assertEquals(callStack, [1], "should not call onModuleInit twice");
});
