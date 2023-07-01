import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-northeast-1" });
/*
const input = { // SignUpRequest
  ClientId: "STRING_VALUE", // required
  SecretHash: "STRING_VALUE",
  Username: "STRING_VALUE", // required
  Password: "STRING_VALUE", // required
  UserAttributes: [ // AttributeListType
    { // AttributeType
      Name: "STRING_VALUE", // required
      Value: "STRING_VALUE",
    },
  ],
  ValidationData: [
    {
      Name: "STRING_VALUE", // required
      Value: "STRING_VALUE",
    },
  ],
  AnalyticsMetadata: { // AnalyticsMetadataType
    AnalyticsEndpointId: "STRING_VALUE",
  },
  UserContextData: { // UserContextDataType
    IpAddress: "STRING_VALUE",
    EncodedData: "STRING_VALUE",
  },
  ClientMetadata: { // ClientMetadataType
    "<keys>": "STRING_VALUE",
  },
};
*/
const command = new SignUpCommand({
  ClientId: process.env.COGNITO_CLIENT_ID,
  Username: process.env.COGNITO_USER_EMAIL,
  Password: "Test#1234",
  UserAttributes: [
    {
      Name: "email",
      Value: process.env.COGNITO_USER_EMAIL
    }
  ]
});
const response = await client.send(command);
console.log(response);
