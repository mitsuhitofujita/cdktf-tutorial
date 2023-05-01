import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";

export interface WebS3BucketConfig {
  prefix: string;
  environment: string;
}

export class WebS3Bucket extends Construct {
  s3bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: WebS3BucketConfig) {
    super(scope, id);

    this.s3bucket = new S3Bucket(this, "s3_bucket", {
      bucket: `${config.prefix}-web-${config.environment}`,
    });

    new S3BucketWebsiteConfiguration(this, "s3_bucket_website", {
      bucket: this.s3bucket.bucket,
      indexDocument: {
        suffix: "index.html",
      },
      errorDocument: {
        key: "erro.html",
      },
    });

    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "s3:GetObject",
          Resource: `${this.s3bucket.arn}/*`,
          Principal: {
            Service: "cloudfront.amazonaws.com",
          },
        },
      ],
    };

    new S3BucketPolicy(this, "s3_bucket_policy", {
      bucket: this.s3bucket.bucket,
      policy: JSON.stringify(bucketPolicy),
    });

    /*
    const basePath = "sveltekit/build/prerendered";
    const paths = getFilePaths(path.resolve(basePath));
    paths.forEach((path) => {
      console.log(getRelativePath(basePath, path));
    });

    new S3Object(this, `${id}_index_document`, {
      bucket: this.s3bucket.bucket,
      key: "index.html",
      source: path.resolve("static_web/index.html"),
      contentType: "text/html",
    });

    new S3Object(this, `${id}_app_index_document`, {
      bucket: this.s3bucket.bucket,
      key: "_app/index.html",
      source: path.resolve("static_web/index.html"),
      contentType: "text/html",
    });

    new S3Object(scope, `${id}_error_document`, {
      bucket: this.s3bucket.bucket,
      key: "error.html",
      source: path.resolve("static_web/error.html"),
      contentType: "text/html",
    });
    */
  }
}
