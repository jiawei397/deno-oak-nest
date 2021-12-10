// deno-lint-ignore-file no-explicit-any ban-types
export interface InjectedData {
  fn: Function;
  params: any[];

  scope?: any;
}

export type InjectParams = (() => any) | string | symbol | InjectedData;
