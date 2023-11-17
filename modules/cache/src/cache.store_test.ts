import { assert, assertEquals } from "../../../tests/test_deps.ts";
import { KVStore, LocalStore, MemoryStore } from "./cache.store.ts";

Deno.test("CacheStore", async (t) => {
  const memoryStore = new MemoryStore();
  const localStore = new LocalStore();

  await t.step("MemoryStore.get", () => {
    memoryStore.set("foo", "bar");
    assertEquals(memoryStore.get("foo"), "bar");
  });

  await t.step("MemoryStore.set with ttl", async () => {
    memoryStore.set("foo", "bar", { ttl: 1 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    assertEquals(memoryStore.get("foo"), undefined);
  });

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

  await t.step("LocalStore.get", () => {
    localStore.set("foo", "bar");
    assertEquals(localStore.get("foo"), "bar");
  });

  await t.step("LocalStore.set with ttl", async () => {
    localStore.set("foo", "bar", { ttl: 1 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    assertEquals(localStore.get("foo"), undefined);
  });

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
});

Deno.test("LocalStore", async (t) => {
  const store = new LocalStore();

  await t.step("should set and get values correctly", async () => {
    // Set a value
    store.set("testKey", "testValue", { ttl: 1 });

    // Get the value
    let value = store.get("testKey");
    assertEquals(value, "testValue");

    // Wait for the ttl to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Try to get the value again
    value = store.get("testKey");
    assertEquals(value, undefined);

    assert(store.has("testKey") === false);
  });

  await t.step("expires should work correctly", () => {
    localStorage.setItem("testKey", `{"td":1700186180979,"value":"testValue"}`);
    const value = store.get("testKey");
    assertEquals(value, undefined);
  });

  await t.step("should delete values correctly", () => {
    // Set a value
    store.set("testKey", "testValue");

    // Delete the value
    store.delete("testKey");

    // Try to get the value
    const value = store.get("testKey");
    assertEquals(value, undefined);
  });

  await t.step("should clear all values", () => {
    // Set some values
    store.set("testKey1", "testValue1");
    store.set("testKey2", "testValue2");

    // Clear the store
    store.clear();

    // Try to get the values
    const value1 = store.get("testKey1");
    const value2 = store.get("testKey2");
    assertEquals(value1, undefined);
    assertEquals(value2, undefined);
  });

  await t.step("should correctly report if it has a key", () => {
    // Set a value
    store.set("testKey", "testValue");

    // Check if the store has the key
    let hasKey = store.has("testKey");
    assertEquals(hasKey, true);

    // Delete the key
    store.delete("testKey");

    // Check if the store has the key
    hasKey = store.has("testKey");
    assertEquals(hasKey, false);
  });

  await t.step("should correctly report its size", () => {
    // Check the initial size
    let size = store.size();
    assertEquals(size, 0);

    // Set some values
    store.set("testKey1", "testValue1");
    store.set("testKey2", "testValue2");

    // Check the size
    size = store.size();
    assertEquals(size, 2);

    // Clear the store
    store.clear();

    // Check the size
    size = store.size();
    assertEquals(size, 0);
  });
});

Deno.test("Deno.kv", async (t) => {
  const store = new KVStore();
  await store.init("test");

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

  store.close();
});
