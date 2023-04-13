import { Construct } from "constructs";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";

export interface CreateRestApiGatewayConfig {
  prefix: string;
  environment: string;
  lambdaFunction: LambdaFunction;
}

export interface CreateRestApiGatewayResult {
  restApi: ApiGatewayRestApi;
  getMethod: ApiGatewayMethod;
  integration: ApiGatewayIntegration;
  deployment: ApiGatewayDeployment;
  stage: ApiGatewayStage;
}

export function createRestApiGateway(
  scope: Construct,
  id: string,
  config: CreateRestApiGatewayConfig
): CreateRestApiGatewayResult {
  const restApi = new ApiGatewayRestApi(scope, `${id}_rest_api`, {
    name: `${config.prefix}-rest-api`,
  });

  /*
  const resource = new ApiGatewayResource(scope, `${id}_api_gateway_resource`, {
    restApiId: restApi.id,
    parentId: restApi.rootResourceId,
    pathPart: "/",
  });
  */

  const getMethod = new ApiGatewayMethod(scope, `${id}_get_method`, {
    restApiId: restApi.id,
    // resourceId: resource.id,
    resourceId: restApi.rootResourceId,
    httpMethod: "GET",
    authorization: "NONE",
  });

  const integration = new ApiGatewayIntegration(
    scope,
    `${id}_api_gateway_integration`,
    {
      restApiId: restApi.id,
      // resourceId: resource.id,
      resourceId: restApi.rootResourceId,
      httpMethod: getMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: config.lambdaFunction.invokeArn,
    }
  );

  const deployment = new ApiGatewayDeployment(
    scope,
    `${id}_api_gateway_deployment`,
    {
      restApiId: restApi.id,
      dependsOn: [getMethod, integration],
    }
  );

  const stage = new ApiGatewayStage(scope, `${id}_api_gateway_stage`, {
    restApiId: restApi.id,
    deploymentId: deployment.id,
    stageName: config.environment,
  });

  return {
    restApi,
    getMethod,
    integration,
    deployment,
    stage,
  };
}
