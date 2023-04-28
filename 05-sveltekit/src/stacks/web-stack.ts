import { Construct } from "constructs";
import { S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { WebS3Bucket } from "../constructs/web-s3-bucket";
import { WebLambdaFunction } from "../constructs/web-lambda-function";
import { WebCloudfront } from "../constructs/web-cloudfront";
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

    const s3Bucket = new WebS3Bucket(this, `${id}_web_bucket`, {
      prefix,
      environment: config.environment,
    });

    const lambdaFunction = new WebLambdaFunction(this, `${id}_web_function`, {
      assetPath: "sveltekit/build/server",
      bucket: s3Bucket.s3bucket,
      environment: config.environment,
      lambdaName: "sveltekit",
      prefix,
      handler: "index.handler",
      runtime: "nodejs16.x",
    });

    /*
    const apiGateway = new HttpApiGateway(this, `${id}_web_rest_api_gateway`, {
      prefix,
      environment: config.environment,
      lambdaFunction: lambdaFunction.lambdaFunction,
    });
    */

    new WebCloudfront(this, `${id}_web_cloudfront`, {
      prefix,
      environment: config.environment,
      region: config.region,
      s3Bucket: s3Bucket.s3bucket,
      // apiGatewayApi: apiGateway.api,
      lambdaFunctionUrl: lambdaFunction.lambdaFunctionUrl,
    });

    /*
    new DirectoryS3Object(this, `${id}_s3_object_prerendered`, {
      baseDirectory: "sveltekit/build/prerendered",
      s3Bucket: s3Bucket.s3bucket,
    });

    new DirectoryS3Object(this, `${id}_s3_object_assets`, {
      baseDirectory: "sveltekit/build/assets",
      s3Bucket: s3Bucket.s3bucket,
    });
    */
  }
}
