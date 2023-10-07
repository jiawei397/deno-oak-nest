export type ApiPrefixOptions = {
  /**
   * The controller path will check by exclude regExp
   * @example
   * ["^/?v\\d{1,3}/", /^\/?v\d{1,3}\//]
   */
  exclude?: (string | RegExp)[];
};

export type ListenOptions = Deno.ServeOptions;

