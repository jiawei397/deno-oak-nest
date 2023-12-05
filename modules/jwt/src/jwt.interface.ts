import { Algorithm } from "../deps.ts";

export interface JwtModuleOptions {
  secret: string;
  global?: boolean;
  signOptions?: SignOptions;
}

export type SignOptions = {
  /** expires time, unit is second */
  expiresIn?: number;

  /**
   * The algorithm used to sign the token.
   * @default HS512
   */
  algorithm?: Algorithm;
};

export interface JwtServiceOptions {
  secretKey: CryptoKey;
  signOptions?: SignOptions;
}
