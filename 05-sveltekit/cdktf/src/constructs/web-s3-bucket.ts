import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketAcl } from "@cdktf/provider-aws/lib/s3-bucket-acl";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
// import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import path = require("path");
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";

export interface CreateS3WebBucketConfig {
  prefix: string;
  environment: string;
}

export class WebS3Bucket extends Construct {
  bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: CreateS3WebBucketConfig) {
    super(scope, id);

    this.bucket = new S3Bucket(this, `${id}_bucket`, {
      bucket: `${config.prefix}-static-web-${config.environment}`,
    });

    new S3BucketAcl(this, `${id}_bucket_acl`, {
      bucket: this.bucket.bucket,
      acl: "private",
    });

    new S3BucketLifecycleConfiguration(
      this,
      `${id}_bucket_lifecycle_configuration`,
      {
        bucket: this.bucket.bucket,
        rule: [
          {
            id: "tfstate",
            status: "Enabled",
            abortIncompleteMultipartUpload: {
              daysAfterInitiation: 7,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      }
    );

    new S3BucketVersioningA(this, `${id}_bucket_versioning`, {
      bucket: this.bucket.bucket,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      `${id}_bucket_server_side_encyption_configuration`,
      {
        bucket: this.bucket.bucket,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, `${id}_bucket_public_access_block`, {
      bucket: this.bucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketWebsiteConfiguration(this, `${id}_bucket_website`, {
      bucket: this.bucket.bucket,
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
          Resource: `${this.bucket.arn}/*`,
          Principal: {
            Service: "cloudfront.amazonaws.com",
          },
        },
      ],
    };

    new S3BucketPolicy(this, `${id}_bucket_policy`, {
      bucket: this.bucket.bucket,
      policy: JSON.stringify(bucketPolicy),
    });

    new S3Object(this, `${id}_index_document`, {
      bucket: this.bucket.bucket,
      key: "index.html",
      source: path.resolve("static_web/index.html"),
      contentType: "text/html",
    });

    new S3Object(this, `${id}_app_index_document`, {
      bucket: this.bucket.bucket,
      key: "_app/index.html",
      source: path.resolve("static_web/index.html"),
      contentType: "text/html",
    });

    new S3Object(scope, `${id}_error_document`, {
      bucket: this.bucket.bucket,
      key: "error.html",
      source: path.resolve("static_web/error.html"),
      contentType: "text/html",
    });
  }
}
