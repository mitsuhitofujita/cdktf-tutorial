import { App } from "cdktf";
import { HttpLambdaStack } from "./stacks/http-lambda-stack";

const project = "cdktf-tutorial";
const environment = "dev";
const app = new App();
new HttpLambdaStack(app, "lambda", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/02-lambda/${environment}.tfstate`,
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
