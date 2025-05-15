# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Getting started

```bash
# Bring up the database
docker compose up

# Generate db client
npx prisma generate
npx prisma migrate dev

# Run the app
pnpm run dev
```

## Available Scripts

In the project directory, you can run:

### `pnpm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `pnpm start`

For production mode

### `pnpm run test`

Run the test cases.

### `pnpm run dbconsole`

Connect to mysql console

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
