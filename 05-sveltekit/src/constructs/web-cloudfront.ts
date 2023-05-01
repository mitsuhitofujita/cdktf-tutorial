import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { CloudfrontOriginAccessControl } from "@cdktf/provider-aws/lib/cloudfront-origin-access-control";
import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { CloudfrontOriginRequestPolicy } from "@cdktf/provider-aws/lib/cloudfront-origin-request-policy";
import { CloudfrontCachePolicy } from "@cdktf/provider-aws/lib/cloudfront-cache-policy";

export interface WebCloudfrontConfig {
  prefix: string;
  environment: string;
  s3Bucket: S3Bucket;
  apiGatewayApi: Apigatewayv2Api;
  region: string;
}

export class WebCloudfront extends Construct {
  cloudfrontDistribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, config: WebCloudfrontConfig) {
    super(scope, id);

    const originAccessControl = new CloudfrontOriginAccessControl(
      this,
      "cloudfront_origin_access_control",
      {
        name: "static",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      }
    );

    const originRequestPolicy = new CloudfrontOriginRequestPolicy(
      this,
      "cloudfront-origin-request-policy",
      {
        name: "api",
        cookiesConfig: {
          cookieBehavior: "all",
        },
        queryStringsConfig: {
          queryStringBehavior: "all",
        },
        headersConfig: {
          headerBehavior: "whitelist",
          headers: {
            items: [
              "Origin",
              "Accept-Charset",
              "Accept",
              "Access-Control-Request-Method",
              "Access-Control-Request-Headers",
              "Referer",
              "Accept-Language",
              "Accept-Datetime",
            ],
          },
        },
      }
    );

    const cachePolicy = new CloudfrontCachePolicy(
      this,
      "cloudfront-cache-policy",
      {
        name: "api",
        maxTtl: 0,
        minTtl: 0,
        defaultTtl: 0,
        parametersInCacheKeyAndForwardedToOrigin: {
          cookiesConfig: {
            cookieBehavior: "none",
          },
          headersConfig: {
            headerBehavior: "none",
          },
          queryStringsConfig: {
            queryStringBehavior: "none",
          },
        },
      }
    );

    this.cloudfrontDistribution = new CloudfrontDistribution(
      this,
      "cloudfront_distribution",
      {
        origin: [
          {
            originId: "api",
            domainName: `${config.apiGatewayApi.id}.execute-api.${config.region}.amazonaws.com`,

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
          originRequestPolicyId: originRequestPolicy.id,
          cachePolicyId: cachePolicy.id,
          allowedMethods: [
            "DELETE",
            "GET",
            "HEAD",
            "OPTIONS",
            "PATCH",
            "POST",
            "PUT",
          ],
          cachedMethods: ["HEAD", "GET"],
          targetOriginId: "api",
          viewerProtocolPolicy: "redirect-to-https",
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
            viewerProtocolPolicy: "redirect-to-https",
            minTtl: 0,
            defaultTtl: 10,
            maxTtl: 10,
            compress: true,
          },
          {
            pathPattern: "sverdle/how-to-play.html",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              queryString: false,
              cookies: {
                forward: "none",
              },
            },
            targetOriginId: "static",
            viewerProtocolPolicy: "redirect-to-https",
            minTtl: 0,
            defaultTtl: 10,
            maxTtl: 10,
            compress: true,
          },
          {
            pathPattern: "index.html",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              queryString: false,
              cookies: {
                forward: "none",
              },
            },
            targetOriginId: "static",
            viewerProtocolPolicy: "redirect-to-https",
            minTtl: 0,
            defaultTtl: 10,
            maxTtl: 10,
            compress: true,
          },
          {
            pathPattern: "favicon.png",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              queryString: false,
              cookies: {
                forward: "none",
              },
            },
            targetOriginId: "static",
            viewerProtocolPolicy: "redirect-to-https",
            minTtl: 0,
            defaultTtl: 10,
            maxTtl: 10,
            compress: true,
          },
          {
            pathPattern: "about.html",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              queryString: false,
              cookies: {
                forward: "none",
              },
            },
            targetOriginId: "static",
            viewerProtocolPolicy: "redirect-to-https",
            minTtl: 0,
            defaultTtl: 10,
            maxTtl: 10,
            compress: true,
          },
          {
            pathPattern: "robot.txt",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
              queryString: false,
              cookies: {
                forward: "none",
              },
            },
            targetOriginId: "static",
            viewerProtocolPolicy: "redirect-to-https",
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
