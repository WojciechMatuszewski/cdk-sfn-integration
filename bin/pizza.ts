#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { PizzaStack } from "../lib/pizza-stack";

const app = new cdk.App();
new PizzaStack(app, "PizzaStack", {
  env: { region: "eu-central-1" }
});
