import rocapi from 'arocapi/express';
import express from 'express';
import expressListRoutes from 'express-list-routes';

const app = express();
app.use('/api', rocapi);

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
