// deno-lint-ignore-file no-explicit-any
export const LogTime = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const result = await originalMethod.apply(this, args);
      console.info(
        target.constructor.name,
        `${propertyKey}, take up time: ${
          (Date.now() - start) /
          1000
        } s`,
      );
      return result;
    };
    return descriptor;
  };
};
