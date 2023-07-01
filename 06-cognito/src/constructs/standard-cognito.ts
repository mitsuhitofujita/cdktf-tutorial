import { CognitoUserPool } from "@cdktf/provider-aws/lib/cognito-user-pool";
import { CognitoUserPoolClient } from "@cdktf/provider-aws/lib/cognito-user-pool-client";
import { Construct } from "constructs";

export interface StandardCognitoConfig {
  environment: string;
  prefix: string;
}

export class StandardCognito extends Construct {
  userPool: CognitoUserPool;
  userPoolClient: CognitoUserPoolClient;

  constructor(scope: Construct, id: string, config: StandardCognitoConfig) {
    super(scope, id);

    this.userPool = new CognitoUserPool(this, "user_pool", {
      name: `${config.prefix}-standard`,
      usernameAttributes: ["email"],
      autoVerifiedAttributes: ["email"],
      schema: [
        {
          attributeDataType: "String",
          name: "email",
          required: true,
        },
      ],
    });

    this.userPoolClient = new CognitoUserPoolClient(this, "user_pool_client", {
      name: `${config.prefix}-standard`,
      userPoolId: this.userPool.id,
      explicitAuthFlows: ["USER_PASSWORD_AUTH"],
    });
  }
}
