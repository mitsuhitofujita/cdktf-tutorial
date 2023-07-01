import { Construct } from "constructs";
import { S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { StandardCognito } from "../constructs/standard-cognito";

export interface CognitoStackConfig {
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
  region: string;
}

export class CognitoStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: CognitoStackConfig) {
    super(scope, id);

    new S3Backend(this, config.backend);

    new AwsProvider(this, "provider", config.provider);

    const prefix = `${config.domain}-${config.project}-${id}`;
    new StandardCognito(this, "cognito", {
      prefix,
      environment: config.environment,
    });
  }
}
