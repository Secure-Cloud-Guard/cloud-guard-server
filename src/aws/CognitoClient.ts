import { CognitoIdentityProviderClient, GetUserCommand, AdminGetUserCommand, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
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

  async getUserEmails(userIds: string[]) {
    const response = await this.client.send(new ListUsersCommand({
      UserPoolId: this.userPoolId,
      AttributesToGet: ['sub', 'email'],
    }));

    return response.Users?.reduce((acc, user) => {
      const userAttrs = user.Attributes;
      const subAttr = userAttrs?.find(attr => attr.Name === 'sub');
      const emailAttr = userAttrs?.find(attr => attr.Name === 'email');

      if (subAttr && emailAttr && userIds.includes(subAttr?.Value as string)) {
        acc[subAttr?.Value as string] = emailAttr.Value;
      }
      return acc;
    }, {});
  }
}

export default CognitoClient;