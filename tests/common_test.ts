// deno-lint-ignore-file no-explicit-any
import { testing } from "../test_deps.ts";

export const createMockContext = (options: {
  path: string;
  method: string;
  body?: {
    type: string;
    value: any;
  };
}) => {
  const { path, method, body } = options;
  const ctx = testing.createMockContext({
    path,
    method,
  });
  (ctx.request as any).body = () => {
    return body;
  };
  return ctx;
};
