import { create, getNumericDate, Payload } from "../deps.ts";
import { SignOptions } from "./jwt.interface.ts";

/**
 * Generate a unique key for HMAC signing
 * @param secretKey The secret key string
 * @returns The CryptoKey object of the key
 */
export function generateUniqueKey(secretKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(secretKey);

  return crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"],
  );
}

/**
 * Generate random HMAC key pair
 * @returns CryptoKey object of the generated key pair
 */
export function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"],
  );
}

/**
 * Generate JWT
 * @param payload The data to be added to the JWT
 * @param key The key used to sign the JWT
 * @param options.expiresIn The expiration time of the JWT in seconds
 * @param options.algorithm The algorithm used to sign the JWT, default is HS512
 * @returns The generated JWT string
 */
export function generateToken(
  payload: Payload,
  key: CryptoKey,
  options?: SignOptions,
): Promise<string> {
  if (options?.expiresIn) {
    payload.exp = getNumericDate(options.expiresIn);
  }
  const alg = options?.algorithm ?? "HS512";
  return create(
    { alg, typ: "JWT" },
    payload,
    key,
  );
}
