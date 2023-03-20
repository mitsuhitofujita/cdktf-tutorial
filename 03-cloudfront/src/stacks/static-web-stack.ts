import { Construct } from "constructs";
import { S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { createS3WebBucket } from "../provider/s3-web-bucket";
import { createStaicWebCloudfront } from "../provider/static-web-cloudfront";

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
}

export class StaticWebStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: StaticWebStackConfig) {
    super(scope, id);

    const prefix = `${config.domain}-${config.project}-${id}`;

    new S3Backend(this, config.backend);

    new AwsProvider(this, "provider", config.provider);

    const bucket = createS3WebBucket(this, "static_web", {
      prefix,
      environment: config.environment,
    });

    const cloudfront = createStaicWebCloudfront(this, "static_web", {
      prefix,
      environment: config.environment,
      s3Bucket: bucket,
    });

    new TerraformOutput(this, "output-cloudfront-endpoint", {
      value: cloudfront.id,
    });

    // new CloudfrontDistribution(this, 'cloudfront', {
    // })
  }
}
