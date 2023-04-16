import { App } from "cdktf";
import { WebStack } from "./stacks/web-stack";

const project = "cdktf-tutorial";
const environment = "dev";
const app = new App();
new WebStack(app, "sveltekit", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/05-sveltekit/${environment}.tfstate`,
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
