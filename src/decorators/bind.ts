function bound(): MethodDecorator {
  return (target, _property, descriptor) => {
    // deno-lint-ignore ban-types
    const fn = descriptor.value as Function;
    if (fn) {
      descriptor.value = fn.bind(target);
    }
  };
}

export const bind = bound();
