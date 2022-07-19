FROM denoland/deno:alpine-1.23.1

EXPOSE 2000

WORKDIR /app

# Prefer not to run as root.
RUN chown -R deno /app
RUN chmod 755 /app

ADD . .

# ENV DENO_DIR=deno-dir

RUN deno cache --config deno.json --unstable example/main.ts

CMD deno run --allow-net --allow-env --allow-write --allow-read --config deno.json --unstable example/main.ts