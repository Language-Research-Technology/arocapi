import { Client } from '@opensearch-project/opensearch';
import Arocapi from 'arocapi/express';
import express from 'express';
import expressListRoutes from 'express-list-routes';

import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

if (!process.env.OPENSEARCH_URL) {
  throw new Error('OPENSEARCH_URL environment variable is not set');
}
const opensearchUrl = process.env.OPENSEARCH_URL;
const opensearch = new Client({ node: opensearchUrl });

const app = express();
const arocapi = await Arocapi({ opensearch, prisma });
app.use('/api', arocapi);

app.get('/', (_req, res) => {
  const routes = expressListRoutes(app).map((r) => r.path);

  res.send({
    about: 'Example implmentation of mounting an ROCrate API in an express app',
    routes,
  });
});

console.log('Mounted ROCrate API');
console.log('Available routes:');
console.log(expressListRoutes(app));

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
export { app };
