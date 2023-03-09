import { Construct } from "constructs";
import { AssetType, S3Backend, TerraformAsset, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import path = require("path");
import { createPrivateS3Bucket } from "../provider/private-s3-bucket";

export interface LambdaStackConfig {
  backend: {
    bucket: string;
    key: string;
    region: string;
  },
  provider: {
    region: string;
  }
  domain: string;
  project: string;
  environment: string;
}

export class LambdaStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: LambdaStackConfig) {
    super(scope, id);

    const prefix = `${config.domain}-${config.project}-${id}`;

    new S3Backend(this, config.backend);

    new aws.provider.AwsProvider(this, 'provider', config.provider);

    const bucket = createPrivateS3Bucket(this, 'lambda', {
      prefix,
      environment: config.environment,
    })

    const asset = new TerraformAsset(this, 'asset', {
      path: path.resolve(__dirname, '../../../lambda/hello/dist'),
      type: AssetType.ARCHIVE,
    });

    const archive = new aws.s3Object.S3Object(this, 'archive', {
      bucket: bucket.bucket,
      key: `hello/${asset.assetHash}/${asset.fileName}`,
      source: asset.path,
      etag: asset.assetHash,
    });

    const lambdaAssumeRolePolicy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Effect": "Allow",
          "Sid": ""
        }
      ]
    };

    const role = new aws.iamRole.IamRole(this, 'role', {
      name: `${prefix}-${config.environment}`,
      assumeRolePolicy: JSON.stringify(lambdaAssumeRolePolicy),
    });

    const lambdaLoggingPolicy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "cloudwatch:PutMetricData",
          ],
          "Resource": [
            "arn:aws:logs:*:*:*"
          ]
        }
      ]
    };

    const loggingPolicy = new aws.iamPolicy.IamPolicy(this, 'logging-policy', {
      name: `${prefix}-logging-${config.environment}`,
      policy: JSON.stringify(lambdaLoggingPolicy),
    })

    const loggingPolicyAttachment = new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'logging-policy-attachment', {
      policyArn: loggingPolicy.arn,
      role: role.name
    });

    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${prefix}-${config.environment}`,
      retentionInDays: 3,
      skipDestroy: false,
    });

    const lambdaFunction = new aws.lambdaFunction.LambdaFunction(this, 'function', {
      functionName: `${prefix}-${config.environment}`,
      s3Bucket: bucket.bucket,
      s3Key: archive.key,
      sourceCodeHash: asset.assetHash,
      handler: 'lambda.handler',
      runtime: 'nodejs16.x',
      role: role.arn,
      dependsOn: [
        logGroup,
        loggingPolicyAttachment,
      ]
    });

    const functionUrl = new aws.lambdaFunctionUrl.LambdaFunctionUrl(this, 'function-url', {
      functionName: lambdaFunction.functionName,
      authorizationType: 'NONE',
    });

    new TerraformOutput(this, 'output-function-arn', {
      value: lambdaFunction.arn,
    });

    new TerraformOutput(this, 'output-function-url', {
      value: functionUrl.functionUrl,
    });
  }
}
