import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { CloudfrontOriginAccessControl } from "@cdktf/provider-aws/lib/cloudfront-origin-access-control";
// import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { CloudfrontOriginRequestPolicy } from "@cdktf/provider-aws/lib/cloudfront-origin-request-policy";
import { CloudfrontCachePolicy } from "@cdktf/provider-aws/lib/cloudfront-cache-policy";
import { LambdaFunctionUrl } from "@cdktf/provider-aws/lib/lambda-function-url";
// import { extractDomainFromURI } from "../helper/extract-domain-from-uri";

export interface WebCloudfrontConfig {
  prefix: string;
  environment: string;
  s3Bucket: S3Bucket;
  // apiGatewayApi: Apigatewayv2Api;
  region: string;
  lambdaFunctionUrl: LambdaFunctionUrl;
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

    const originRequestPolicy = new CloudfrontOriginRequestPolicy(
      this,
      `${id}-origin-request-policy`,
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

    const cachePolicy = new CloudfrontCachePolicy(this, `${id}-cache-policy`, {
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
    });

    console.log(config.lambdaFunctionUrl.functionUrl);

    this.cloudfrontDistribution = new CloudfrontDistribution(
      this,
      `${id}_cloudfront_distribution`,
      {
        origin: [
          {
            originId: "api",
            // originPath: "/dev",
            // domainName: `${config.apiGatewayApi.id}.execute-api.${config.region}.amazonaws.com`,
            domainName:
              "bkdi2twcu2cue27bg6btoh3b340lpdgs.lambda-url.ap-northeast-1.on.aws",
            // domainName: extractDomainFromURI(
            //   config.lambdaFunctionUrl.functionUrl
            // ),

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
          // forwardedValues: {
          //   queryString: true,
          //   cookies: {
          //     forward: "all",
          //   },
          // },
          viewerProtocolPolicy: "redirect-to-https",
          // minTtl: 0,
          // defaultTtl: 0,
          // maxTtl: 0,
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
          {
            pathPattern: "*.html",
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
          {
            pathPattern: "*.png",
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
          {
            pathPattern: "*.txt",
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
