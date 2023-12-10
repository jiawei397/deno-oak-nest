import { loadYaml } from "./utils.ts";

export interface Config {
  clientId: string;
  clientSecret: string;
  port: number;
  jwtSecret: string;
  jwtExpiration: number;
  tokenKey: string;
  redirectBaseURL: string;
}

const config: Config = await loadYaml<Config>("config.yaml");

config.clientId = Deno.env.get("CLIENT_ID") || config.clientId;
config.clientSecret = Deno.env.get("CLIENT_SECRET") || config.clientSecret;
config.jwtSecret = Deno.env.get("JWT_SECRET") || config.jwtSecret;
config.jwtExpiration = Deno.env.get("JWT_EXPIRATION")
  ? Number(Deno.env.get("JWT_EXPIRATION"))
  : config.jwtExpiration;
config.tokenKey = Deno.env.get("TOKEN_KEY") || config.tokenKey;
config.redirectBaseURL = Deno.env.get("REDIRECT_BASE_URL") ||
  config.redirectBaseURL;

export default config;
