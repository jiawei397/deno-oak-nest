FROM denoland/deno:alpine-1.37.0

EXPOSE 2000

WORKDIR /app

# Prefer not to run as root.
RUN chown -R deno /app
RUN chmod 755 /app
USER deno

COPY . .

# ENV DENO_DIR=deno-dir

RUN deno cache --unstable example/dev/main.ts

CMD deno run --allow-net --allow-env --allow-write --allow-read --unstable example/dev/main.ts