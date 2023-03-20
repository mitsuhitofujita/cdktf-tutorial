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

export function createS3WebBucket(
  scope: Construct,
  id: string,
  config: CreateS3WebBucketConfig
): S3Bucket {
  const bucket = new S3Bucket(scope, `${id}_bucket`, {
    bucket: `${config.prefix}-${config.environment}`,
  });

  new S3BucketAcl(scope, `${id}_bucket_acl`, {
    bucket: bucket.bucket,
    acl: "private",
  });

  new S3BucketLifecycleConfiguration(
    scope,
    `${id}_bucket_lifecycle_configuration`,
    {
      bucket: bucket.bucket,
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

  new S3BucketVersioningA(scope, `${id}_bucket_versioning`, {
    bucket: bucket.bucket,
    versioningConfiguration: {
      status: "Enabled",
    },
  });

  new S3BucketServerSideEncryptionConfigurationA(
    scope,
    `${id}_bucket_server_side_encyption_configuration`,
    {
      bucket: bucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    }
  );

  new S3BucketPublicAccessBlock(scope, `${id}_bucket_public_access_block`, {
    bucket: bucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });

  new S3BucketWebsiteConfiguration(scope, `${id}_bucket_website`, {
    bucket: bucket.bucket,
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
        Resource: `${bucket.arn}/*`,
        Principal: {
          Service: "cloudfront.amazonaws.com",
        },
      },
    ],
  };

  new S3BucketPolicy(scope, `${id}_bucket_policy`, {
    bucket: bucket.bucket,
    policy: JSON.stringify(bucketPolicy),
  });

  new S3Object(scope, `${id}_index_document`, {
    bucket: bucket.bucket,
    key: "index.html",
    source: path.resolve("static_web/index.html"),
    contentType: "text/html",
  });

  new S3Object(scope, `${id}_error_document`, {
    bucket: bucket.bucket,
    key: "error.html",
    source: path.resolve("static_web/error.html"),
    contentType: "text/html",
  });

  return bucket;
}
