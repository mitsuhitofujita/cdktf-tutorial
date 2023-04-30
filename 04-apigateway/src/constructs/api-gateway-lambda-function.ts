import { Construct } from "constructs";
import { AssetType, TerraformAsset } from "cdktf";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import * as path from "path";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";

export interface ApiGatewayLambdaFunctionConfig {
  assetPath: string;
  s3Bucket: S3Bucket;
  environment: string;
  lambdaName: string;
  prefix: string;
  handler: string;
  runtime: string;
}

export class ApiGatewayLambdaFunction extends Construct {
  lambdaFunction: LambdaFunction;
  lambdaPermission: LambdaPermission;

  constructor(
    scope: Construct,
    id: string,
    config: ApiGatewayLambdaFunctionConfig
  ) {
    super(scope, id);

    const asset = new TerraformAsset(this, "asset", {
      path: path.resolve(config.assetPath),
      type: AssetType.ARCHIVE,
    });

    const archive = new S3Object(this, "archive", {
      bucket: config.s3Bucket.bucket,
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

    const role = new IamRole(this, "role", {
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

    const loggingIamPolicy = new IamPolicy(this, "logging_policy", {
      name: `${config.prefix}-logging-${config.environment}`,
      policy: JSON.stringify(loggingPolicy),
    });

    const loggingPolicyAttachment = new IamRolePolicyAttachment(
      this,
      `${id}_logging_policy_attachment`,
      {
        policyArn: loggingIamPolicy.arn,
        role: role.name,
      }
    );

    const cloudwatchLogGroup = new CloudwatchLogGroup(this, "log_group", {
      name: `/aws/lambda/${config.prefix}-${config.environment}`,
      retentionInDays: 3,
      skipDestroy: false,
    });

    this.lambdaFunction = new LambdaFunction(this, "lambda_function", {
      functionName: `${config.prefix}-${config.environment}`,
      s3Bucket: config.s3Bucket.bucket,
      s3Key: archive.key,
      sourceCodeHash: asset.assetHash,
      handler: config.handler,
      runtime: config.runtime,
      role: role.arn,
      dependsOn: [cloudwatchLogGroup, loggingPolicyAttachment],
    });

    this.lambdaPermission = new LambdaPermission(this, "lambda_permission", {
      statementId: "AllowExecutionFromApiGateway",
      action: "lambda:InvokeFunction",
      functionName: this.lambdaFunction.functionName,
      principal: "apigateway.amazonaws.com",
    });
  }
}
