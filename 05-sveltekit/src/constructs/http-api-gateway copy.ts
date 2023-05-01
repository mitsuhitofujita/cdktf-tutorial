import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { Apigatewayv2Integration } from "@cdktf/provider-aws/lib/apigatewayv2-integration";
import { Apigatewayv2Route } from "@cdktf/provider-aws/lib/apigatewayv2-route";
import { Apigatewayv2Stage } from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { Construct } from "constructs";

export interface HttpApiGatewayConfig {
  prefix: string;
  environment: string;
  lambdaFunction: LambdaFunction;
}

export class HttpApiGateway extends Construct {
  httpApiGateway: Apigatewayv2Api;

  constructor(scope: Construct, id: string, config: HttpApiGatewayConfig) {
    super(scope, id);

    this.httpApiGateway = new Apigatewayv2Api(this, "http_api_gateway", {
      name: `${config.prefix}-${config.environment}`,
      protocolType: "HTTP",
    });

    /*
    const route = new Apigatewayv2Route(this, "api_gateway_route", {
      apiId: this.httpApiGateway.id,
      routeKey: "ANY /{proxy+}",
    });
    */

    const integration = new Apigatewayv2Integration(
      this,
      "api_gateway_integration",
      {
        apiId: this.httpApiGateway.id,
        integrationType: "AWS_PROXY",
        integrationUri: config.lambdaFunction.invokeArn,
        integrationMethod: "POST",
      }
    );

    new Apigatewayv2Route(this, "api_gateway_integration_route", {
      apiId: this.httpApiGateway.id,
      routeKey: "ANY /{proxy}",
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Stage(this, "api_gateway_stage", {
      apiId: this.httpApiGateway.id,
      name: "$default",
      autoDeploy: true,
    });
  }
}
