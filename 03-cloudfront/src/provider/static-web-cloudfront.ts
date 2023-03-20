import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { CloudfrontOriginAccessControl } from "@cdktf/provider-aws/lib/cloudfront-origin-access-control";

export interface CreateStaicCloudfrontConfig {
  prefix: string;
  environment: string;
  s3Bucket: S3Bucket;
}

export function createStaicWebCloudfront(
  scope: Construct,
  id: string,
  config: CreateStaicCloudfrontConfig
): CloudfrontDistribution {
  const originAccessControl = new CloudfrontOriginAccessControl(
    scope,
    `${id}_cloudfront_origin_access_control`,
    {
      name: "static_web",
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4",
    }
  );

  const cloudfront = new CloudfrontDistribution(scope, `${id}_cloudfront`, {
    origin: [
      {
        domainName: config.s3Bucket.bucketRegionalDomainName,
        originAccessControlId: originAccessControl.id,
        originId: "static_web",
      },
    ],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
      allowedMethods: [
        "DELETE",
        "GET",
        "HEAD",
        "OPTIONS",
        "PATCH",
        "POST",
        "PUT",
      ],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: "static_web",
      forwardedValues: {
        queryString: false,
        cookies: {
          forward: "none",
        },
      },
      viewerProtocolPolicy: "allow-all",
      minTtl: 0,
      defaultTtl: 10,
      maxTtl: 10,
    },
    priceClass: "PriceClass_100",
    restrictions: {
      geoRestriction: {
        restrictionType: "whitelist",
        locations: ["JP"],
      },
    },
    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },
  });

  return cloudfront;
}
