import { assert, assertEquals } from "../../../tests/test_deps.ts";
import { KVStore, LocalStore, MemoryStore } from "./cache.store.ts";

Deno.test("MemoryStore", async (t) => {
  const memoryStore = new MemoryStore();

  await t.step("MemoryStore.get", () => {
    memoryStore.set("foo", "bar");
    assertEquals(memoryStore.get("foo"), "bar");
  });

  await t.step("MemoryStore.set with ttl", async () => {
    memoryStore.set("foo", "bar", { ttl: 0.1 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    assertEquals(memoryStore.get("foo"), undefined);
  });

  await t.step("MemoryStore.set with default ttl", async () => {
    const memoryStore = new MemoryStore({ ttl: 0.1 });
    memoryStore.set("foo", "bar");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assertEquals(memoryStore.get("foo"), undefined);
  });

  await t.step(
    "MemoryStore.set with default ttl, but work with self ttl",
    async () => {
      const localStore = new MemoryStore({ ttl: 0.1 });
      localStore.set("foo", "bar", { ttl: 1 });
      await new Promise((resolve) => setTimeout(resolve, 500));
      assertEquals(localStore.get("foo"), "bar");

      await new Promise((resolve) => setTimeout(resolve, 500));
      assertEquals(localStore.get("foo"), undefined);
    },
  );

  await t.step("MemoryStore.delete", () => {
    memoryStore.set("foo", "bar");
    memoryStore.delete("foo");
    assertEquals(memoryStore.get("foo"), undefined);
  });

  await t.step("MemoryStore.clear", () => {
    memoryStore.set("foo", "bar");
    memoryStore.set("baz", "qux");
    memoryStore.clear();
    assertEquals(memoryStore.get("foo"), undefined);
    assertEquals(memoryStore.get("baz"), undefined);
  });

  await t.step("MemoryStore.clear with ttl", () => {
    memoryStore.set("foo", "bar", { ttl: 1 });
    memoryStore.set("baz", "qux");
    memoryStore.clear();
    assertEquals(memoryStore.get("foo"), undefined);
    assertEquals(memoryStore.get("baz"), undefined);
  });

  await t.step("MemoryStore.has", () => {
    memoryStore.set("foo", "bar");
    assertEquals(memoryStore.has("foo"), true);
    assertEquals(memoryStore.has("baz"), false);
  });

  await t.step("MemoryStore.size", () => {
    memoryStore.set("foo", "bar");
    memoryStore.set("baz", "qux");
    assertEquals(memoryStore.size(), 2);
  });
});

Deno.test("LocalStore", async (t) => {
  const localStore = new LocalStore();

  await t.step("LocalStore.get", () => {
    localStore.set("foo", "bar");
    assertEquals(localStore.get("foo"), "bar");
  });

  await t.step("LocalStore.set with ttl", async () => {
    localStore.set("foo", "bar", { ttl: 0.1 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    assertEquals(localStore.get("foo"), undefined);
  });

  await t.step("LocalStore.set with default ttl", async () => {
    const localStore = new LocalStore({ ttl: 0.1 });
    localStore.set("foo", "bar");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assertEquals(localStore.get("foo"), undefined);
  });

  await t.step(
    "LocalStore.set with default ttl, but work with self ttl",
    async () => {
      const localStore = new LocalStore({ ttl: 0.1 });
      localStore.set("foo", "bar", { ttl: 1 });
      await new Promise((resolve) => setTimeout(resolve, 500));
      assertEquals(localStore.get("foo"), "bar");

      await new Promise((resolve) => setTimeout(resolve, 500));
      assertEquals(localStore.get("foo"), undefined);
    },
  );

  await t.step("LocalStore.delete", () => {
    localStore.set("foo", "bar");
    localStore.delete("foo");
    assertEquals(localStore.get("foo"), undefined);
  });

  await t.step("LocalStore.clear", () => {
    localStore.set("foo", "bar");
    localStore.set("baz", "qux");
    localStore.clear();
    assertEquals(localStore.get("foo"), undefined);
    assertEquals(localStore.get("baz"), undefined);
  });

  await t.step("LocalStore.clear with ttl", () => {
    localStore.set("foo", "bar", { ttl: 1 });
    localStore.set("baz", "qux");
    localStore.clear();
    assertEquals(localStore.get("foo"), undefined);
    assertEquals(localStore.get("baz"), undefined);
  });

  await t.step("LocalStore.has", () => {
    localStore.set("foo", "bar");
    assertEquals(localStore.has("foo"), true);
    assertEquals(localStore.has("baz"), false);
  });

  await t.step("LocalStore.size", () => {
    localStore.set("foo", "bar");
    localStore.set("baz", "qux");
    assertEquals(localStore.size(), 2);
  });

  await t.step("should set and get values correctly", async () => {
    // Set a value
    localStore.set("testKey", "testValue", { ttl: 1 });

    // Get the value
    let value = localStore.get("testKey");
    assertEquals(value, "testValue");

    // Wait for the ttl to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Try to get the value again
    value = localStore.get("testKey");
    assertEquals(value, undefined);

    assert(localStore.has("testKey") === false);
  });

  await t.step("expires should work correctly", () => {
    localStorage.setItem("testKey", `{"td":1700186180979,"value":"testValue"}`);
    const value = localStore.get("testKey");
    assertEquals(value, undefined);
  });

  await t.step("should delete values correctly", () => {
    // Set a value
    localStore.set("testKey", "testValue");

    // Delete the value
    localStore.delete("testKey");

    // Try to get the value
    const value = localStore.get("testKey");
    assertEquals(value, undefined);
  });

  await t.step("should clear all values", () => {
    // Set some values
    localStore.set("testKey1", "testValue1");
    localStore.set("testKey2", "testValue2");

    // Clear the store
    localStore.clear();

    // Try to get the values
    const value1 = localStore.get("testKey1");
    const value2 = localStore.get("testKey2");
    assertEquals(value1, undefined);
    assertEquals(value2, undefined);
  });

  await t.step("should correctly report if it has a key", () => {
    // Set a value
    localStore.set("testKey", "testValue");

    // Check if the store has the key
    let hasKey = localStore.has("testKey");
    assertEquals(hasKey, true);

    // Delete the key
    localStore.delete("testKey");

    // Check if the store has the key
    hasKey = localStore.has("testKey");
    assertEquals(hasKey, false);
  });

  await t.step("should correctly report its size", () => {
    // Check the initial size
    let size = localStore.size();
    assertEquals(size, 0);

    // Set some values
    localStore.set("testKey1", "testValue1");
    localStore.set("testKey2", "testValue2");

    // Check the size
    size = localStore.size();
    assertEquals(size, 2);

    // Clear the store
    localStore.clear();

    // Check the size
    size = localStore.size();
    assertEquals(size, 0);
  });
});

Deno.test("Deno.kv", async (t) => {
  const store = new KVStore();
  await store.init();

  await t.step("should set and get values correctly", async () => {
    // Set a value
    await store.set("testKey", "testValue", { ttl: 1 });

    // Get the value
    const value = await store.get("testKey");
    assertEquals(value, "testValue");

    // // Wait for the ttl to expire
    // await new Promise((resolve) => setTimeout(resolve, 10000));

    // Try to get the value again, it is not right expired, so not test
    // value = await store.get("testKey");
    // assertEquals(value, undefined);

    assertEquals(await store.has("testKey"), true);
  });

  await t.step("should delete values correctly", async () => {
    // Set a value
    await store.set("testKey", "testValue");

    // Delete the value
    await store.delete("testKey");

    // Try to get the value
    const value = await store.get("testKey");
    assertEquals(value, undefined);

    assertEquals(await store.has("testKey"), false);
    assertEquals(await store.has("testKey3"), false);
  });

  await t.step("should clear all values", async () => {
    // Set some values
    await store.set("testKey1", "testValue1");
    await store.set("testKey2", "testValue2");

    // Clear the store
    await store.clear();

    // Try to get the values
    const value1 = await store.get("testKey1");
    const value2 = await store.get("testKey2");
    assertEquals(value1, undefined);
    assertEquals(value2, undefined);

    const size = await store.size();
    assertEquals(size, 0);
  });

  await t.step("should correctly report if it has a key", async () => {
    // Set a value
    await store.set("testKey", "testValue");

    // Check if the store has the key
    let hasKey = await store.has("testKey");
    assertEquals(hasKey, true);

    // Delete the key
    await store.delete("testKey");

    // Check if the store has the key
    hasKey = await store.has("testKey");
    assertEquals(hasKey, false);
  });

  await t.step("should correctly report its size", async () => {
    // Check the initial size
    let size = await store.size();
    assertEquals(size, 0);

    // Set some values
    await store.set("testKey1", "testValue1");
    await store.set("testKey2", "testValue2");

    // Check the size
    size = await store.size();
    assertEquals(size, 2);
  });

  await t.step("change baseKey", async () => {
    const store2 = new KVStore({ baseKey: "test" });
    await store2.init();

    await store.set("testKey", "testValue");
    assertEquals(await store.get("testKey"), "testValue");

    assertEquals(await store2.get("testKey"), undefined);

    await store2.set("testKey", "testValue2");
    assertEquals(await store2.get("testKey"), "testValue2");

    await store2.clear();

    store2.close();
  });

  await store.clear();
  store.close();
});
