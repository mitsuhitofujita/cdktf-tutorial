import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient({ region: "ap-northeast-1" });
/*
{
   "AnalyticsMetadata": { 
      "AnalyticsEndpointId": "string"
   },
   "ClientId": "string",
   "ClientMetadata": { 
      "string" : "string" 
   },
   "ConfirmationCode": "string",
   "ForceAliasCreation": boolean,
   "SecretHash": "string",
   "UserContextData": { 
      "EncodedData": "string",
      "IpAddress": "string"
   },
   "Username": "string"
}
*/
const command = new ConfirmSignUpCommand({
  ClientId: "",
  Username: "",
  ConfirmationCode: "",
});
const response = await client.send(command);
console.log(response);
/*
{
  '$metadata': {
    httpStatusCode: 200,
    requestId: '',
    extendedRequestId: undefined,
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  }
}
*/
