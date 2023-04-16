import { Construct } from "constructs";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { Apigatewayv2Stage } from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import { Apigatewayv2Route } from "@cdktf/provider-aws/lib/apigatewayv2-route";
import { Apigatewayv2Integration } from "@cdktf/provider-aws/lib/apigatewayv2-integration";

export interface ApiGatewayConfig {
  prefix: string;
  environment: string;
  lambdaFunction: LambdaFunction;
}

export class ApiGateway extends Construct {
  api: Apigatewayv2Api;
  stage: Apigatewayv2Stage;
  integration: Apigatewayv2Integration;

  constructor(scope: Construct, id: string, config: ApiGatewayConfig) {
    super(scope, id);

    this.api = new Apigatewayv2Api(this, `${id}_api_gateway`, {
      name: `${config.prefix}`,
      protocolType: "HTTP",
    });

    this.stage = new Apigatewayv2Stage(this, `${id}_api_gateway_stage`, {
      apiId: this.api.id,
      name: config.environment,
      autoDeploy: true,
    });

    this.integration = new Apigatewayv2Integration(
      this,
      `${id}_api_gateway_integration`,
      {
        apiId: this.api.id,
        integrationType: "AWS_PROXY",
        integrationUri: config.lambdaFunction.invokeArn,
        integrationMethod: "POST",
      }
    );

    new Apigatewayv2Route(this, `${id}_api_gateway_route`, {
      apiId: this.api.id,
      routeKey: "GET /",
      target: `integrations/${this.integration.id}`,
    });
  }
}
