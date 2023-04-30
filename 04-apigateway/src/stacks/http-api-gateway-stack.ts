import { Construct } from "constructs";
import { S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import { LambdaS3Bucket } from "../constructs/lambda-s3-bucket";
import { ApiGatewayLambdaFunction } from "../constructs/api-gateway-lambda-function";
import { HttpApiGateway } from "../constructs/http-api-gateway";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

export interface HttpApiGatewayStackConfig {
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

export class HttpApiGatewayStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: HttpApiGatewayStackConfig) {
    super(scope, id);

    const prefix = `${config.domain}-${config.project}-${id}`;

    new S3Backend(this, config.backend);

    new AwsProvider(this, "provider", config.provider);

    const lambdaS3Bucket = new LambdaS3Bucket(this, "lambda", {
      prefix,
      environment: config.environment,
    });

    const helloLambda = new ApiGatewayLambdaFunction(this, "hello_lambda", {
      assetPath: "lambda/hello/dist",
      s3Bucket: lambdaS3Bucket.s3bucket,
      environment: config.environment,
      lambdaName: "hello",
      prefix,
      handler: "lambda.handler",
      runtime: "nodejs16.x",
    });

    const httpApiGateway = new HttpApiGateway(this, "hello", {
      environment: config.environment,
      prefix,
      lambdaFunction: helloLambda.lambdaFunction,
    });

    new TerraformOutput(this, "api_gateway_url", {
      value: httpApiGateway.httpApiGateway.apiEndpoint,
    });
  }
}
