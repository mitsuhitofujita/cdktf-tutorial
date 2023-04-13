import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketAcl } from "@cdktf/provider-aws/lib/s3-bucket-acl";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";


export interface CreatePrivateS3BucketConfig {
    prefix: string;
    environment: string;
};

export function createPrivateS3Bucket(scope: Construct, id: string, config: CreatePrivateS3BucketConfig): S3Bucket {
    const bucket = new S3Bucket(scope, `${id}_bucket`, {
        bucket: `${config.prefix}-${config.environment}`,
    });

    new S3BucketAcl(scope, `${id}_bucket_acl`, {
        bucket: bucket.bucket,
        acl: 'private',
    });

    new S3BucketLifecycleConfiguration(scope, `${id}_bucket_lifecycle_configuration`, {
        bucket: bucket.bucket,
        rule: [
            {
                id: 'tfstate',
                status: 'Enabled',
                abortIncompleteMultipartUpload: {
                    daysAfterInitiation: 7,
                },
                noncurrentVersionExpiration: {
                    noncurrentDays: 30,
                },
            }
        ]
    });

    new S3BucketVersioningA(scope, `${id}_bucket_versioning`, {
        bucket: bucket.bucket,
        versioningConfiguration: {
            status: 'Enabled'
        }
    });

    new S3BucketServerSideEncryptionConfigurationA(scope, `${id}_bucket_server_side_encyption_configuration`, {
        bucket: bucket.bucket,
        rule: [
            {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: 'AES256',
                },
            },
        ],
    });

    new S3BucketPublicAccessBlock(scope, `${id}_bucket_public_access_block`, {
        bucket: bucket.bucket,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
    });

    return bucket;
}