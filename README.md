# deno_nest

[![deno version](https://img.shields.io/badge/deno-^1.37.0-blue?logo=deno)](https://github.com/denoland/deno)
[![Deno](https://github.com/jiawei397/deno-oak-nest/actions/workflows/deno.yml/badge.svg)](https://github.com/jiawei397/deno-oak-nest/actions/workflows/deno.yml)
[![codecov](https://codecov.io/gh/jiawei397/deno-oak-nest/branch/master/graph/badge.svg?token=NKP41TU4SL)](https://codecov.io/gh/jiawei397/deno-oak-nest)

Rely on [oak@v12.6.1](https://deno.land/x/oak@v12.6.1/mod.ts) and
[hono@v3.9.1](https://deno.land/x/hono@v3.9.1/mod.ts) to simulate some
annotation functions of [NestJS](https://docs.nestjs.com/) which is a great
frame for Node.js.

You can change the `oak` or `Hono` version if need, but the safest use is to use
the version recommended by `Nest`, as it has undergone thorough unit testing.

> The previous framework name was `oak_nest`, now renamed `deno_nest`.
>
> It is recommended to use `Hono` as the underlying layer because its
> performance is better.

## Usage & Guide

To view our documentation, please visit
[official site](https://nests.deno.dev/en-US).

## TODO

- [x] support Guard
- [x] support Interceptor
- [x] support ExceptionFilter
- [x] unit test self
- [x] provide API to help unit
- [x] support oak
- [x] support hono
- [x] static assets
- [x] support lifecycle
- [x] Nest CLI
- [x] unit Hono and Oak self
- [x] alias
- [ ] Nest Doc, doing now

---

> You can see more in the example dirs.
