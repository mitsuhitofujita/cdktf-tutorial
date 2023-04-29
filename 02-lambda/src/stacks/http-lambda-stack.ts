import { Construct } from "constructs";
import { S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { LambdaS3Bucket } from "../constructs/lambda-s3-bucket";
import { HttpLambdaFunction } from "../constructs/http-lambda-function";

export interface HttpLambdaStackConfig {
  backend: {
    bucket: string;
    key: string;
    region: string;
  };
  provider: {
    region: string;
  };
  domain: string;
  project: string;
  environment: string;
}

export class HttpLambdaStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: HttpLambdaStackConfig) {
    super(scope, id);

    const prefix = `${config.domain}-${config.project}-${id}`;

    new S3Backend(this, config.backend);

    new aws.provider.AwsProvider(this, "provider", config.provider);

    const lambdaS3Bucket = new LambdaS3Bucket(this, "lambda", {
      prefix,
      environment: config.environment,
    });

    const helloLambdaFunction = new HttpLambdaFunction(this, "hello_lambda", {
      assetPath: "lambda/hello/dist",
      s3Bucket: lambdaS3Bucket.s3bucket,
      environment: config.environment,
      lambdaName: "hello",
      prefix,
      handler: "lambda.handler",
      runtime: "nodejs16.x",
    });

    new TerraformOutput(this, "output-function-url", {
      value: helloLambdaFunction.lambdaFunctionUrl.functionUrl,
    });
  }
}
