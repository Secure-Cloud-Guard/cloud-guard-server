import { CognitoIdentityProviderClient, GetUserCommand, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import dotenv from 'dotenv';

dotenv.config();

class CognitoClient {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
    this.userPoolId = process.env.COGNITO_USER_POOL_ID as string;
  }

  async getCurrentUser(accessToken: string) {
    return await this.client.send(new GetUserCommand({
      AccessToken: accessToken
    }));
  }

  async getUser(userAlias: string) {
    return await this.client.send(new AdminGetUserCommand({
      UserPoolId: this.userPoolId,
      Username: userAlias
    }));
  }

  async getUserEmail(userId: string) {
    const { UserAttributes } = await this.getUser(userId);

      if (!UserAttributes) {
        return;
      }

      for (const attribute of UserAttributes) {
        if (attribute.Name === 'email') {
          return attribute.Value as string;
        }
      }
  }
}

export default CognitoClient;