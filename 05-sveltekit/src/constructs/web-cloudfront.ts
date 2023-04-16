import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { CloudfrontOriginAccessControl } from "@cdktf/provider-aws/lib/cloudfront-origin-access-control";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";

export interface WebCloudfrontConfig {
  prefix: string;
  environment: string;
  s3Bucket: S3Bucket;
  apiGatewayRestApi: ApiGatewayRestApi;
  region: string;
}

export class WebCloudfront extends Construct {
  cloudfrontDistribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, config: WebCloudfrontConfig) {
    super(scope, id);

    const originAccessControl = new CloudfrontOriginAccessControl(
      this,
      `${id}_cloudfront_origin_access_control`,
      {
        name: "static",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      }
    );

    this.cloudfrontDistribution = new CloudfrontDistribution(
      this,
      `${id}_cloudfront_distribution`,
      {
        origin: [
          {
            originId: "api",
            originPath: "/dev",
            domainName: `${config.apiGatewayRestApi.id}.execute-api.${config.region}.amazonaws.com`,
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,

              originProtocolPolicy: "https-only",
              originSslProtocols: ["TLSv1.2"],
            },
          },
          {
            originId: "static",
            domainName: config.s3Bucket.bucketRegionalDomainName,
            originAccessControlId: originAccessControl.id,
          },
        ],
        enabled: true,
        isIpv6Enabled: true,
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
          targetOriginId: "api",
          forwardedValues: {
            queryString: true,
            cookies: {
              forward: "all",
            },
          },
          viewerProtocolPolicy: "allow-all",
          minTtl: 0,
          defaultTtl: 10,
          maxTtl: 10,
          compress: true,
        },
        orderedCacheBehavior: [
          {
            pathPattern: "_app/*",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              queryString: false,
              cookies: {
                forward: "none",
              },
            },
            targetOriginId: "static",
            viewerProtocolPolicy: "allow-all",
            minTtl: 0,
            defaultTtl: 10,
            maxTtl: 10,
            compress: true,
          },
        ],
        priceClass: "PriceClass_200",
        restrictions: {
          geoRestriction: {
            restrictionType: "whitelist",
            locations: ["JP"],
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
      }
    );
  }
}
