import { App } from "cdktf";
import { RestApiGatewayStack } from "./stacks/rest-api-gateway-stack";

const project = "cdktf-tutorial";
const environment = "dev";
const app = new App();
new RestApiGatewayStack(app, "apigateway", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/04-apigateway/${environment}.tfstate`,
    region: process.env.AWS_DEFAULT_REGION,
  },
  provider: {
    region: process.env.AWS_DEFAULT_REGION,
  },
  domain: process.env.TERRAFORM_DOMAIN,
  project,
  environment,
});
app.synth();
