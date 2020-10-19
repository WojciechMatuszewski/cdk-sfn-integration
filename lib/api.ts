import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import { getFunctionPath } from "./utils/utils";

type Props = {
  machine: sfn.StateMachine;
};

export class API extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, { machine }: Props) {
    super(scope, id);

    const orderHandler = new lambda.Function(this, "orderHandler", {
      code: lambda.Code.fromAsset(getFunctionPath("order-pizza")),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        MACHINE_ARN: machine.stateMachineArn
      }
    });
    machine.grantStartExecution(orderHandler);

    const api = new apigw.RestApi(this, "restAPI", {
      deploy: false
    });
    const deployment = new apigw.Deployment(this, "restAPDeployment", {
      api
    });
    const stage = new apigw.Stage(this, "stage", {
      deployment,
      stageName: "dev"
    });

    const ingredientsModel = api.addModel("RequestModel", {
      modelName: "ensureIngredientsModel",
      contentType: "application/json",
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT7,
        title: "ensureIngredients",
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          ingredients: {
            type: apigw.JsonSchemaType.ARRAY,
            minItems: 1,
            items: {
              type: apigw.JsonSchemaType.STRING,
              enum: ["Cham", "Pineapple", "Cheese", "Sausage"]
            }
          }
        },
        required: ["ingredients"]
      }
    });

    const orderIntegration = new apigw.LambdaIntegration(orderHandler);
    const method = api.root
      .addResource("order", {
        defaultCorsPreflightOptions: {
          allowHeaders: ["*"],
          allowMethods: ["*"],
          allowOrigins: ["*"]
        }
      })
      .addMethod("POST", orderIntegration, {
        requestModels: {
          "application/json": ingredientsModel
        },
        requestValidatorOptions: {
          requestValidatorName: "testValidator",
          validateRequestBody: true,
          validateRequestParameters: false
        }
      });

    deployment.node.addDependency(method);
    new cdk.CfnOutput(this, "APIUrl", {
      value: `https://${deployment.api.restApiId}.execute-api.${deployment.env.region}.amazonaws.com/${stage.stageName}`
    });
  }
}
