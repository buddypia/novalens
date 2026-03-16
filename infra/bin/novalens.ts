#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NovalensStack } from '../lib/novalens-stack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') ?? 'staging';

new NovalensStack(app, `NovaLens-${stage}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  stage,
});
