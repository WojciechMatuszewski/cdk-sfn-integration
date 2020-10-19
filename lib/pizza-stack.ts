import * as cdk from "@aws-cdk/core";
import { API } from "./api";
import * as dynamo from "@aws-cdk/aws-dynamodb";
import { StateMachine } from "./state-machine";

export class PizzaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamo.Table(this, "orders-table", {
      partitionKey: { type: dynamo.AttributeType.STRING, name: "pk" }
    });

    const machine = new StateMachine(this, "pizza-state-machine", {
      table
    });
    new API(this, "pizza-api", { machine: machine.machine });
  }
}
