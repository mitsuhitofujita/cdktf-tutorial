import { Construct } from "constructs";
import { App, AssetType, S3Backend, TerraformAsset, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import path = require("path");

interface LambdaStackConfig {
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

class LambdaStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: LambdaStackConfig) {
    super(scope, id);

    const prefix = `${config.domain}-${config.project}-${id}`;

    new S3Backend(this, config.backend);

    new aws.provider.AwsProvider(this, 'provider', config.provider);

    const bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: `${prefix}-${config.environment}`,
      tags: {
        "Policy": "can-deploy-lambda-function",
      },
    });

    new aws.s3BucketAcl.S3BucketAcl(this, 'bucket-acl', {
      bucket: bucket.bucket,
      acl: 'private',
    });

    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(this, 'bucket-lifecycle-configuration', {
      bucket: bucket.bucket,
      rule: [
        {
          id: 'tfstate',
          status: 'Enabled',
          abortIncompleteMultipartUpload: {
            daysAfterInitiation: 7,
          },
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
          },
        }
      ]
    });

    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: bucket.bucket,
      versioningConfiguration: {
        status: 'Enabled'
      }
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(this, 'bucket-server-side-encyption-configuration', {
      bucket: bucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: bucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const asset = new TerraformAsset(this, 'asset', {
      path: path.resolve(__dirname, 'lambda/hello/dist'),
      type: AssetType.ARCHIVE,
    });

    const archive = new aws.s3Object.S3Object(this, 'archive', {
      bucket: bucket.bucket,
      key: `hello/${asset.assetHash}/${asset.fileName}`,
      source: asset.path,
    });

    const execRole = new aws.iamRole.IamRole(this, 'role-exec', {
      name: `${prefix}-exec-${config.environment}`,
      assumeRolePolicy: JSON.stringify(
        {
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
        }
      ),
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'role-exec-attach', {
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: execRole.name
    });

    const func = new aws.lambdaFunction.LambdaFunction(this, 'function', {
      functionName: `${prefix}-${config.environment}`,
      s3Bucket: bucket.bucket,
      s3Key: archive.key,
      handler: 'lambda.handler',
      runtime: 'nodejs16.x',
      role: execRole.arn,
    });

    new TerraformOutput(this, 'function-arn', {
      value: func.arn
    });
  }
}

const project = 'cdktf-tutorial';
const environment = 'dev';
const app = new App();
new LambdaStack(app, "lambda", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/02-lambda/${environment}.tfstate`,
    region: process.env.AWS_DEFAULT_REGION,
  },
  provider: {
    region: process.env.AWS_DEFAULT_REGION,
  },
  domain: process.env.TERRAFORM_DOMAIN,
  project,
  environment,
});
app.synth();
