import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import dotenv from 'dotenv';

dotenv.config();

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const cognitoClient = {
  getUser: async (accessToken: string) => {
    return await client.send(new GetUserCommand({
      AccessToken: accessToken
    }));
  }
}

export default cognitoClient;