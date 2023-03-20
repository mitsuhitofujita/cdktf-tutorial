import { App } from "cdktf";
import { StaticWebStack } from "./stacks/static-web-stack";

const project = "cdktf-tutorial";
const environment = "dev";
const app = new App();
new StaticWebStack(app, "cloudfront", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/03-cloudfront/${environment}.tfstate`,
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
