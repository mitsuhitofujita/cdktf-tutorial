import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  const name = event.queryStringParameters?.name || "World";

  return {
    statusCode: 200,
    body: `Hello, ${name}!`,
  };
};
