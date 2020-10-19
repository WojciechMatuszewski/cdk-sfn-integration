import { newHandler } from "./handler";
import StepFunctions from "aws-sdk/clients/stepfunctions";

const stepFunctionsClient = new StepFunctions();

const handler = newHandler({
  executionStarter: params =>
    stepFunctionsClient.startExecution(params).promise(),
  machineArn: process.env.MACHINE_ARN as string
});

export { handler };
