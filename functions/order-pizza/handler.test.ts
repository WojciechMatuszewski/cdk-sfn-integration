import { newHandler } from "./handler";

test("returns bad request", async () => {
  const handler = newHandler({
    executionStarter: () => Promise.reject(),
    machineArn: ""
  });

  const body = JSON.stringify({ ingredients: ["Cham"] });
  const result = await handler({ body } as any, {} as any, () => {});

  expect(result).toEqual({ body: "An error occurred", statusCode: 500 });
});

test("returns successful response", async () => {
  const handler = newHandler({
    executionStarter: async () =>
      ({ executionArn: "TEST_EXECUTION_ARN" } as any),
    machineArn: ""
  });

  const body = JSON.stringify({ ingredients: ["Cham"] });
  const result = await handler({ body } as any, {} as any, () => {});

  expect(result).toEqual({
    body: JSON.stringify({ order: "TEST_EXECUTION_ARN" }),
    statusCode: 200
  });
});
