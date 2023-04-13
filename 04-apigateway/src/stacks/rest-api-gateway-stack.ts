import { Construct } from "constructs";
import { S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { createPrivateS3Bucket } from "../provider/private-s3-bucket";
import { createHttpLambdaFunction } from "../provider/lambda-function";
import { createRestApiGateway } from "../provider/rest-api-gateway";

export interface LambdaStackConfig {
  backend: {
    bucket: string;
    key: string;
    region: string;
  };
  provider: {
    region: string;
  };
  domain: string;
  project: string;
  environment: string;
}

export class RestApiGatewayStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: LambdaStackConfig) {
    super(scope, id);

    const prefix = `${config.domain}-${config.project}-${id}`;

    new S3Backend(this, config.backend);

    new aws.provider.AwsProvider(this, "provider", config.provider);

    const lambdaBucket = createPrivateS3Bucket(this, "lambda", {
      prefix,
      environment: config.environment,
    });

    const helloLambda = createHttpLambdaFunction(this, "hello_lambda", {
      assetPath: "lambda/hello/dist",
      bucket: lambdaBucket,
      environment: config.environment,
      lambdaName: "hello",
      prefix,
      handler: "lambda.handler",
      runtime: "nodejs16.x",
    });

    const apiGateway = createRestApiGateway(this, "hello", {
      environment: config.environment,
      prefix,
      lambdaFunction: helloLambda.function,
    });

    new TerraformOutput(this, "output_api_gateway_arn", {
      value: apiGateway.deployment.fqn,
    });

    new TerraformOutput(this, "output-function-arn", {
      value: helloLambda.function.arn,
    });
  }
}

/*
provider "aws" {
  region = "us-east-1"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "my_distribution" {
  origin {
    domain_name = aws_api_gateway_deployment.my_api.invoke_url
    origin_id   = "my-api-gateway-origin"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  # Add any desired cache behaviors and viewer protocols here
}

# API Gateway Deployment
resource "aws_api_gateway_rest_api" "my_api" {
  name        = "my-api"
  description = "My example API"
}

resource "aws_api_gateway_resource" "my_resource" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "my-resource"
}

resource "aws_api_gateway_method" "my_method" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.my_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "my_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.my_resource.id
  http_method             = aws_api_gateway_method.my_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda.invoke_arn
}

resource "aws_api_gateway_deployment" "my_api" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"
}

# Lambda Function
resource "aws_lambda_function" "my_lambda" {
  filename         = "lambda_function_payload.zip"
  function_name    = "my-lambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.8"
  source_code_hash = filebase64sha256("lambda_function_payload.zip")
}

resource "aws_iam_role" "lambda_exec" {
  name = "lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_exec" {
  name        = "lambda-exec-policy"
  description = "Policy for Lambda execution role"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Action    = "logs:*"
        Resource  = "arn:aws:logs:*:*:*"
  },
  {
    Effect    = "Allow"
    Action    = "execute-api:Invoke"
    Resource  = aws_api_gateway_deployment.my_api.execution_arn
  }
]
})
}

resource "aws_iam_role_policy_attachment" "lambda_exec" {
policy_arn = aws_iam_policy.lambda_exec.arn
role = aws_iam_role.lambda_exec.name
}

# CloudFront Lambda@Edge function
resource "aws_lambda_function" "cf_lambda" {
filename = "cf_lambda_payload.zip"
function_name = "my-cf-lambda"
role = aws_iam_role.cf_lambda_exec.arn
handler = "lambda_function.lambda_handler"
runtime = "nodejs14.x"
source_code_hash = filebase64sha256("cf_lambda_payload.zip")
}

resource "aws_iam_role" "cf_lambda_exec" {
name = "cf-lambda-exec-role"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "lambda.amazonaws.com"
}
},
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "edgelambda.amazonaws.com"
}
}
]
})
}

resource "aws_iam_policy" "cf_lambda_exec" {
name = "cf-lambda-exec-policy"
description = "Policy for CloudFront Lambda@Edge execution role"
policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = "logs:"
Resource = "arn:aws:logs:::"
},
{
Effect = "Allow"
Action = "lambda:InvokeFunction"
Resource = aws_lambda_function.my_lambda.arn
}
]
})
}

resource "aws_iam_role_policy_attachment" "cf_lambda_exec" {
policy_arn = aws_iam_policy.cf_lambda_exec.arn
role = aws_iam_role.cf_lambda_exec.name
}

# CloudFront Lambda@Edge trigger
resource "aws_cloudfront_distribution" "my_distribution" {

...
lambda_function_association {
event_type = "viewer-request"
include_body = false
lambda_arn = aws_lambda_function.cf_lambda.qualified_arn
}
}
*/
