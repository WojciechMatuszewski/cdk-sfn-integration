import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as StepFunctions from "aws-sdk/clients/stepfunctions";
import { AWSError } from "aws-sdk/lib/core";
import { PromiseResult } from "aws-sdk/lib/request";

type Props = {
  executionStarter: (
    params: StepFunctions.StartExecutionInput
  ) => Promise<PromiseResult<StepFunctions.StartExecutionOutput, AWSError>>;
  machineArn: string;
};

function newHandler({ executionStarter, machineArn }: Props) {
  const handler: APIGatewayProxyHandlerV2 = async event => {
    try {
      const result = await executionStarter({
        stateMachineArn: machineArn,
        input: event.body
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ order: result.executionArn })
      };
    } catch (e) {
      return {
        statusCode: 500,
        body: "An error occurred"
      };
    }
  };

  return handler;
}

export { newHandler };
