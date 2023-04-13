import { Construct } from "constructs";
import { AssetType, TerraformAsset } from "cdktf";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import path = require("path");
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";

export interface CreateHttpLambdaFunctionConfig {
  assetPath: string;
  bucket: S3Bucket;
  environment: string;
  lambdaName: string;
  prefix: string;
  handler: string;
  runtime: string;
}

export interface HttpLambdaFunctionResult {
  function: LambdaFunction;
  permission: LambdaPermission;
}

export function createHttpLambdaFunction(
  scope: Construct,
  id: string,
  config: CreateHttpLambdaFunctionConfig
): HttpLambdaFunctionResult {
  const asset = new TerraformAsset(scope, `${id}_asset`, {
    path: path.resolve(config.assetPath),
    type: AssetType.ARCHIVE,
  });

  const archive = new S3Object(scope, `${id}_archive`, {
    bucket: config.bucket.bucket,
    key: `${config.lambdaName}/${asset.assetHash}/${asset.fileName}`,
    source: asset.path,
    etag: asset.assetHash,
  });

  const assumeRolePolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "AssumeRole",
      },
    ],
  };

  const role = new IamRole(scope, `${id}_role`, {
    name: `${config.prefix}-${config.environment}`,
    assumeRolePolicy: JSON.stringify(assumeRolePolicy),
  });

  const loggingPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData",
        ],
        Resource: ["arn:aws:logs:*:*:*"],
      },
    ],
  };

  const loggingIamPolicy = new IamPolicy(scope, `${id}_logging_policy`, {
    name: `${config.prefix}-logging-${config.environment}`,
    policy: JSON.stringify(loggingPolicy),
  });

  const loggingPolicyAttachment = new IamRolePolicyAttachment(
    scope,
    `${id}_logging_policy_attachment`,
    {
      policyArn: loggingIamPolicy.arn,
      role: role.name,
    }
  );

  const cloudwatchLogGroup = new CloudwatchLogGroup(scope, `${id}_log_group`, {
    name: `/aws/lambda/${config.prefix}-${config.environment}`,
    retentionInDays: 3,
    skipDestroy: false,
  });

  const func = new LambdaFunction(scope, `${id}_function`, {
    functionName: `${config.prefix}-${config.environment}`,
    s3Bucket: config.bucket.bucket,
    s3Key: archive.key,
    sourceCodeHash: asset.assetHash,
    handler: config.handler,
    runtime: config.runtime,
    role: role.arn,
    dependsOn: [cloudwatchLogGroup, loggingPolicyAttachment],
  });

  const permission = new LambdaPermission(scope, `${id}_permission`, {
    statementId: "AllowExecutionFromApiGateway",
    action: "lambda:InvokeFunction",
    functionName: func.functionName,
    principal: "apigateway.amazonaws.com",
  });

  return {
    function: func,
    permission,
  };
}