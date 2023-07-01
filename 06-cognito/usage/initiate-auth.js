import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient({ region: "ap-northeast-1" });
/*
const input = { // InitiateAuthRequest
  AuthFlow: "USER_SRP_AUTH" || "REFRESH_TOKEN_AUTH" || "REFRESH_TOKEN" || "CUSTOM_AUTH" || "ADMIN_NO_SRP_AUTH" || "USER_PASSWORD_AUTH" || "ADMIN_USER_PASSWORD_AUTH", // required
  AuthParameters: { // AuthParametersType
    "<keys>": "STRING_VALUE",
  },
  ClientMetadata: { // ClientMetadataType
    "<keys>": "STRING_VALUE",
  },
  ClientId: "STRING_VALUE", // required
  AnalyticsMetadata: { // AnalyticsMetadataType
    AnalyticsEndpointId: "STRING_VALUE",
  },
  UserContextData: { // UserContextDataType
    IpAddress: "STRING_VALUE",
    EncodedData: "STRING_VALUE",
  },
};
*/
const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
    USERNAME: "",
    PASSWORD: "Test#1234",
    },
    ClientId: "",
});

const response = client.send(command);
console.log (response);
