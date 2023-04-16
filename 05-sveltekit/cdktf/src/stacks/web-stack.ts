import { Construct } from "constructs";
import { S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { WebS3Bucket } from "../constructs/web-s3-bucket";
import { WebLambdaFunction } from "../constructs/web-lambda-function";
import { WebApiGateway } from "../constructs/web-api-gateway";
import { WebCloudfront } from "../constructs/web-cloudfront";

export interface StaticWebStackConfig {
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
  region: string;
}

export class WebStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: StaticWebStackConfig) {
    super(scope, id);

    new S3Backend(this, config.backend);

    new AwsProvider(this, "provider", config.provider);

    const prefix = `${config.domain}-${config.project}-${id}`;

    const s3Bucket = new WebS3Bucket(this, `${id}_web_bucket`, {
      prefix,
      environment: config.environment,
    });

    const lambdaFunction = new WebLambdaFunction(this, `${id}_web_function`, {
      assetPath: "lambda/hello/dist",
      bucket: s3Bucket.bucket,
      environment: config.environment,
      lambdaName: "hello",
      prefix,
      handler: "lambda.handler",
      runtime: "nodejs16.x",
    });

    const apiGateway = new WebApiGateway(this, `${id}_web_rest_api_gateway`, {
      prefix,
      environment: config.environment,
      lambdaFunction: lambdaFunction.lambdaFunction,
    });

    new WebCloudfront(this, `${id}_web_cloudfront`, {
      prefix,
      environment: config.environment,
      region: config.region,
      s3Bucket: s3Bucket.bucket,
      apiGatewayRestApi: apiGateway.restApi,
    });
  }
}
