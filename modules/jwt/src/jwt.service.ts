import { Inject, Injectable } from "@nest/core";
import type { JwtServiceOptions } from "./jwt.interface.ts";
import { optionKey } from "./jwt.constant.ts";
import { Payload, verify } from "../deps.ts";
import { generateToken } from "./jwt.utils.ts";

@Injectable()
export class JwtService {
  constructor(@Inject(optionKey) private options: JwtServiceOptions) {
    this.options = options;
  }

  sign(payload: Payload): Promise<string> {
    return generateToken(
      payload,
      this.options.secretKey,
      this.options.signOptions,
    );
  }

  verify(token: string): Promise<Payload> {
    return verify(token, this.options.secretKey);
  }
}
