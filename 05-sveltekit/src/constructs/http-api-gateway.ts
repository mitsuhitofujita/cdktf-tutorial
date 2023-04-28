import { Construct } from "constructs";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { Apigatewayv2Stage } from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import { Apigatewayv2Route } from "@cdktf/provider-aws/lib/apigatewayv2-route";
import { Apigatewayv2Integration } from "@cdktf/provider-aws/lib/apigatewayv2-integration";

export interface HttpApiGatewayConfig {
  prefix: string;
  environment: string;
  lambdaFunction: LambdaFunction;
}

export class HttpApiGateway extends Construct {
  api: Apigatewayv2Api;
  stage: Apigatewayv2Stage;
  integration: Apigatewayv2Integration;
  route: Apigatewayv2Route;

  constructor(scope: Construct, id: string, config: HttpApiGatewayConfig) {
    super(scope, id);

    this.api = new Apigatewayv2Api(this, `${id}_http_api_gateway`, {
      name: `${config.prefix}`,
      protocolType: "HTTP",
    });

    this.stage = new Apigatewayv2Stage(this, `${id}_http_api_gateway_stage`, {
      apiId: this.api.id,
      name: config.environment,
      autoDeploy: true,
    });

    this.integration = new Apigatewayv2Integration(
      this,
      `${id}_http_api_gateway_integration`,
      {
        apiId: this.api.id,
        connectionType: "INTERNET",
        integrationType: "AWS_PROXY",
        integrationUri: config.lambdaFunction.invokeArn,
        integrationMethod: "POST",
      }
    );

    this.route = new Apigatewayv2Route(this, `${id}_http_api_gateway_route`, {
      apiId: this.api.id,
      routeKey: "ANY /",
      target: `integrations/${this.integration.id}`,
    });
  }
}
