export class DepositFinalisedError extends Error {
  statusCode = 409;
  expose = true;
}
