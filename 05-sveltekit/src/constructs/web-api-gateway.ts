import { Construct } from "constructs";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";

export interface WebApiGatewayConfig {
  prefix: string;
  environment: string;
  lambdaFunction: LambdaFunction;
}

export class WebApiGateway extends Construct {
  restApi: ApiGatewayRestApi;
  method: ApiGatewayMethod;
  integration: ApiGatewayIntegration;
  deployment: ApiGatewayDeployment;
  stage: ApiGatewayStage;

  constructor(scope: Construct, id: string, config: WebApiGatewayConfig) {
    super(scope, id);

    this.restApi = new ApiGatewayRestApi(this, `${id}_rest_api`, {
      name: `${config.prefix}`,
    });

    this.method = new ApiGatewayMethod(this, `${id}_method`, {
      restApiId: this.restApi.id,
      resourceId: this.restApi.rootResourceId,
      httpMethod: "ANY",
      authorization: "NONE",
    });

    this.integration = new ApiGatewayIntegration(
      this,
      `${id}_api_gateway_integration`,
      {
        restApiId: this.restApi.id,
        resourceId: this.restApi.rootResourceId,
        httpMethod: this.method.httpMethod,
        integrationHttpMethod: "POST",
        type: "AWS_PROXY",
        uri: config.lambdaFunction.invokeArn,
      }
    );

    this.deployment = new ApiGatewayDeployment(
      this,
      `${id}_api_gateway_deployment`,
      {
        restApiId: this.restApi.id,
        dependsOn: [this.methodGet, this.integration],
      }
    );

    this.stage = new ApiGatewayStage(this, `${id}_api_gateway_stage`, {
      restApiId: this.restApi.id,
      deploymentId: this.deployment.id,
      stageName: config.environment,
    });
  }
}
