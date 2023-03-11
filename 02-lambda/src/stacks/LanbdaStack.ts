import { Construct } from "constructs";
import { S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { createPrivateS3Bucket } from "../provider/private-s3-bucket";
import { createHttpLambdaFunction } from "../provider/http-lambda-function";

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

    const lambdaBucket = createPrivateS3Bucket(this, 'lambda', {
      prefix,
      environment: config.environment,
    })

    const helloLambda = createHttpLambdaFunction(this, 'hello_lambda', {
      assetPath: 'lambda/hello/dist',
      bucket: lambdaBucket,
      environment: config.environment,
      lambdaName: 'hello',
      prefix,
      handler: 'lambda.handler',
      runtime: 'nodejs16.x',
    })

    new TerraformOutput(this, 'output-function-arn', {
      value: helloLambda.function.arn,
    });

    new TerraformOutput(this, 'output-function-url', {
      value: helloLambda.functionUrl.functionUrl,
    });
  }
}
