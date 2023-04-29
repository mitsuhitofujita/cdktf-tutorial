import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
// import { S3BucketAcl } from "@cdktf/provider-aws/lib/s3-bucket-acl";

export interface LambdaS3BucketConfig {
  prefix: string;
  environment: string;
}

export class LambdaS3Bucket extends Construct {
  s3bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: LambdaS3BucketConfig) {
    super(scope, id);

    this.s3bucket = new S3Bucket(this, "bucket", {
      bucket: `${config.prefix}-${config.environment}`,
    });

    /*
    new S3BucketAcl(this, "bucket_acl", {
      bucket: this.s3bucket.bucket,
      acl: "private",
    });
    */
  }
}
