import { Construct } from "constructs";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";

import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";

import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";

export interface CreateStaicCloudfrontConfig {
  prefix: string;
  environment: string;
  region: string;
  apiGatewayDeployment: ApiGatewayDeployment;
  apiGateway: ApiGatewayRestApi;
  apiGatewayStage: string;
}

export function createStaicWebCloudfront(
  scope: Construct,
  id: string,
  config: CreateStaicCloudfrontConfig
): CloudfrontDistribution {
  const cloudfront = new CloudfrontDistribution(scope, `${id}_cloudfront`, {
    origin: [
      {
        domainName: new URL(config.apiGatewayDeployment.invokeUrl).hostname,
        originPath: config.apiGatewayStage,
        originId: "rest_api",
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: "https-only",
          originSslProtocols: ["TLSv1.2"],
        },
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
      targetOriginId: "rest_api",
      forwardedValues: {
        queryString: true,
        cookies: {
          forward: "all",
        },
      },
      viewerProtocolPolicy: "allow-all",
      minTtl: 0,
      defaultTtl: 0,
      maxTtl: 0,
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
