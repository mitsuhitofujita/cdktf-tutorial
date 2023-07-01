import { App } from "cdktf";
import { CognitoStack } from "./stacks/cognito-stack";

const project = "cdktf-tutorial";
const environment = "dev";
const app = new App();
new CognitoStack(app, "cognito", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/06-cognito/${environment}.tfstate`,
    region: process.env.AWS_DEFAULT_REGION,
  },
  provider: {
    region: process.env.AWS_DEFAULT_REGION,
  },
  domain: process.env.TERRAFORM_DOMAIN,
  project,
  environment,
  region: process.env.AWS_DEFAULT_REGION,
});
app.synth();
