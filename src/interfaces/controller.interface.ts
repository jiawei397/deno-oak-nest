export type AliasOptions = {
  /**
   * The alias path, if not set, the path will be the same as the normal path.
   */
  alias?: string;
  /**
   * If true, the alias will be used as the path, and only the alias will be used as the path.
   *
   * If the alias is set too, the normal path will be ignored.
   */
  isAliasOnly?: boolean;
};
