import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as dynamo from "@aws-cdk/aws-dynamodb";

type Props = {
  table: dynamo.Table;
};

export class StateMachine extends cdk.Construct {
  public machine: sfn.StateMachine;

  constructor(scope: cdk.Construct, id: string, { table }: Props) {
    super(scope, id);

    const saveOrder = new sfn.CustomState(this, "pizza-save-order", {
      stateJson: {
        Type: "Task",
        Resource: "arn:aws:states:::dynamodb:putItem",
        Parameters: {
          TableName: table.tableName,
          Item: {
            pk: {
              // the `S.$` syntax is required
              "S.$": "$$.Execution.Id"
            },
            status: {
              S: "PROCESSING"
            }
          }
        },
        ResultPath: null
      }
    });

    const updateSuccess = new sfn.CustomState(
      this,
      "pizza-update-success-order",
      {
        stateJson: {
          Type: "Task",
          Resource: "arn:aws:states:::dynamodb:updateItem",
          Parameters: {
            TableName: table.tableName,
            Key: {
              pk: {
                // the `S.$` syntax is required
                "S.$": "$$.Execution.Id"
              }
            },
            UpdateExpression: "SET #s = :success",
            ExpressionAttributeNames: {
              "#s": "status"
            },
            ExpressionAttributeValues: {
              ":success": "SUCCESS"
            }
          },
          ResultPath: null
        }
      }
    );

    const updateFailure = new sfn.CustomState(
      this,
      "pizza-update-failure-order",
      {
        stateJson: {
          Type: "Task",
          Resource: "arn:aws:states:::dynamodb:updateItem",
          Parameters: {
            TableName: table.tableName,
            Key: {
              pk: {
                // the `S.$` syntax is required
                "S.$": "$$.Execution.Id"
              }
            },
            UpdateExpression: "SET #s = :failure",
            ExpressionAttributeNames: {
              "#s": "status"
            },
            ExpressionAttributeValues: {
              ":failure": "failure"
            }
          },
          ResultPath: null
        }
      }
    );

    const transformInput = new sfn.Pass(this, "pizza-mapper", {
      parameters: {
        "ingredients.$": "States.JsonToString($.ingredients)"
      },
      outputPath: "$"
    });

    const matchesForbiddenIngredient = sfn.Condition.stringMatches(
      sfn.JsonPath.stringAt("$.ingredients"),
      "*Pineapple*"
    );
    const choice = new sfn.Choice(this, "pizza-choice")
      .when(matchesForbiddenIngredient, updateFailure)
      .otherwise(updateSuccess);

    const definition = saveOrder
      .next(transformInput)
      .next(
        new sfn.Wait(this, "pizza-wait", {
          time: sfn.WaitTime.duration(cdk.Duration.seconds(2))
        })
      )
      .next(choice);

    this.machine = new sfn.StateMachine(this, "pizza-machine", {
      definition
    });

    table.grantWriteData(this.machine.role);
  }
}
