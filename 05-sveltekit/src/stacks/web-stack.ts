import { Construct } from "constructs";
import { S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { WebS3Bucket } from "../constructs/web-s3-bucket";
import { WebCloudfront } from "../constructs/web-cloudfront";
import { LambdaS3Bucket } from "../constructs/lambda-s3-bucket";
import { ApiGatewayLambdaFunction } from "../constructs/api-gateway-lambda-function";
import { HttpApiGateway } from "../constructs/http-api-gateway";
// import { HttpApiGateway } from "../constructs/http-api-gateway";

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

    const lambdaS3Bucket = new LambdaS3Bucket(this, "lambda_s3_bucket", {
      prefix,
      environment: config.environment,
    });

    const lambdaFunction = new ApiGatewayLambdaFunction(
      this,
      "api_gateway_lambda_function",
      {
        assetPath: "sveltekit/build/server",
        s3Bucket: lambdaS3Bucket.s3Bucket,
        environment: config.environment,
        lambdaName: "sveltekit",
        prefix,
        handler: "index.handler",
        runtime: "nodejs16.x",
      }
    );

    const httpApiGateway = new HttpApiGateway(this, "http_api_gateway", {
      environment: config.environment,
      prefix,
      lambdaFunction: lambdaFunction.lambdaFunction,
    });

    const webS3Bucket = new WebS3Bucket(this, "web_s3_bucket", {
      prefix,
      environment: config.environment,
    });

    new WebCloudfront(this, "web_cloudfront", {
      prefix,
      environment: config.environment,
      region: config.region,
      s3Bucket: webS3Bucket.s3bucket,
      apiGatewayApi: httpApiGateway.httpApiGateway,
    });

    /*
    new DirectoryS3Object(this, "prerendered", {
      baseDirectory: "sveltekit/build/prerendered",
      s3Bucket: s3Bucket.s3bucket,
    });
    */

    /*
    new DirectoryS3Object(this, `${id}_s3_object_assets`, {
      baseDirectory: "sveltekit/build/assets",
      s3Bucket: s3Bucket.s3bucket,
    });
    */
  }
}
