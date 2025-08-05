[RO-Crate]: https://www.researchobject.org/ro-crate/specification
[OCFL]: https://ocfl.io/
[PILARS]: https://w3id.org/ldac/pilars
[REMS]: https://trust.aaf.edu.au/rems/


# An RO-Crate API for Data Collections : Arocapi 

This project is a prototype implementation of an RO-Crate based collections archive and data portal based on the Portland Common Data model of collections suitable use in long-term archival repository systems that aim to follow the Protocols for Long Term Archival Repository Services ([PILARS]) <https://w3id.org/ldac/pilars>.

The aim is to provide an API-centred reference implementation of a repository with an access-controlled web portal for data dissemination and deposit:

- Backend-agnostic RO-Crate storage using pluggable storage-layers 
  - [OCFL] - the Oxford Common File Layout specification on disk or cloud-based object storage
  - Object Storage as used in [PARADISEC]
  - A simple RO-Crate file layout (TODO - likely a super-simple protocol for directory hierarchy with the presense on RO-Crate used to indicate that everythig under that directory is a single RO-Crate)
- Authorisation based on the concept of Access (and Deposit, TODO) Licenses arms-length process, consulting an external authority such as a REMS instance or
  - Based on the princuple that all data MUST have a implementation-neutral natural-language description of its access conditiions stored with it
  - Licenses may be based on access control lists maintained in software such as PARADISEC or a license manager such as REMS, (TODO: an example implementation using github groups to manage license access)).



## Getting started

This project was bootstrapped with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

To run:

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
