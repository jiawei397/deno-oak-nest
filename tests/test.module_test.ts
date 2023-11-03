// deno-lint-ignore-file no-unused-vars
import { Controller, Get } from "../src/decorators/controller.ts";
import { Injectable } from "../src/decorators/inject.ts";
import { assert, assertEquals } from "./test_deps.ts";
import { createTestingModule } from "./test.module.ts";

@Injectable()
class B {
  findAll() {
    return "b";
  }
}

@Injectable()
class C {
}

@Controller("")
class A {
  constructor(private readonly b: B, private readonly c: C) {}

  @Get("")
  find() {
    return this.b.findAll();
  }
}

Deno.test("test origin only with controller", async () => {
  const moduleRef = createTestingModule({
    controllers: [A],
    // providers: [B],
  })
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(b instanceof B);
  assert(a["b"] === b);
  assertEquals(a.find(), "b");

  class C {}
  const c = await moduleRef.get(C);
  assertEquals(c, null);
});

Deno.test("test origin with providers", async () => {
  const moduleRef = createTestingModule({
    controllers: [A],
    providers: [B],
  })
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(b instanceof B);
  assert(a["b"] === b);
  assertEquals(a.find(), "b");
});

Deno.test("inject data by other object", async () => {
  const d = {
    findAll() {
      return "d";
    },
  };
  const moduleRef =  createTestingModule({
    controllers: [A],
  }).overrideProvider(B, d)
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(!(b instanceof B));
  assert(a["b"] === b);
  assert(b === d);
  assertEquals(a.find(), "d");
});

Deno.test("change provider self", async () => {
  const moduleRef =  createTestingModule({
    controllers: [A],
  })
    .compile();
  const a = await moduleRef.get(A);
  assert(a instanceof A);
  const b = await moduleRef.get(B);
  assert(b instanceof B);

  b.findAll = () => {
    return "bb";
  };

  assert(a["b"] === b);
  assertEquals(a.find(), "bb");
});

Deno.test("resolve will return not same", async () => {
  const moduleRef =  createTestingModule({
    controllers: [A],
  })
    .compile();
  const b = await moduleRef.get(B);
  assert(b instanceof B);
  const c = await moduleRef.resolve(B);
  assert(c instanceof B);
  assert(b !== c);

  const d = await moduleRef.resolve(B);
  assert(d !== c);
});

Deno.test("e2e test", async () => {
  const moduleRef =  createTestingModule({
    controllers: [A],
    // providers: [B],
  })
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  const res = await fetch(`http://localhost:${app.port}/`);
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "b");

  await app.close();
});
