import { DeleteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv';
import CognitoClient from "./CognitoClient";
import { AccessRights, ShareWithUser } from "../types/s3";

dotenv.config();

class DynamoClient {
  private client: DynamoDBClient;
  private readonly SHARING_TABLE = 'CloudGuardSharing';

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.DYNAMO_DB_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async share(ownerId: string, folderUrl: string, userIds: string[]) {
    if (userIds.length === 0) {
      await this.deleteSharing(ownerId, folderUrl);
    } else {
      await this.client.send(new PutItemCommand({
        TableName: this.SHARING_TABLE,
        Item: {
          sharingId: {
            S: ownerId + '-' + folderUrl
          },
          ownerId: {
            S: ownerId
          },
          folderUrl: {
            S: folderUrl
          },
          userIds: {
            SS: userIds
          }
        }
      }));
    }
  }

  async deleteSharing(ownerId: string, folderUrl: string) {
    await this.client.send(new DeleteItemCommand({
      TableName: this.SHARING_TABLE,
      Key: {
        sharingId: {
          S: ownerId + '-' + folderUrl
        },
      }
    }));
  }

  async getShareWithIds(ownerId: string, folderUrl: string) {
    const { Item } = await this.client.send(new GetItemCommand({
      TableName: this.SHARING_TABLE,
      Key: {
        sharingId: {
          S: ownerId + '-' + folderUrl
        }
      }
    }));

    const shareWith = Item?.userIds.SS;
    return !shareWith || (shareWith?.length === 1 && shareWith[0] === '')
      ? []
      : shareWith ;
  }

  async getShareWith(ownerId: string, folderUrl: string) {
    const shareWithIds = await this.getShareWithIds(ownerId, folderUrl) as string[];
    let shareWith: ShareWithUser[] = [];
    let emails: any = [];

    if (shareWithIds.length > 0) {
      const cognitoClient = new CognitoClient();
      emails = await cognitoClient.getUserEmails(shareWithIds);
    }

    for (let userId of shareWithIds) {
      const userEmail = emails[userId];

      if (!userEmail) {
        continue;
      }

      shareWith.push({
        userId: userId,
        userEmail: userEmail,
        rights: AccessRights.Read
      });
    }
    return shareWith;
  }

  async getFoldersWithUser(userId: string) {
    const { Items } = await this.client.send(new ScanCommand({
      TableName: 'CloudGuardSharing',
      ProjectionExpression: 'ownerId, folderUrl, userIds'
    }));

    const sharingFolders: { ownerId: string, ownerEmail: string, folderUrl: string }[] = [];

    if (Items) {
      const cognitoClient = new CognitoClient();
      const emails = await cognitoClient.getUserEmails(Items.map(sharing => sharing.ownerId.S as string));

      for (let sharing of Items) {
        const ownerId = sharing.ownerId.S as string;
        const folderUrl = sharing.folderUrl.S as string;
        const shareWith = sharing.userIds.SS;
        const ownerEmail = emails?.[ownerId];

        if (shareWith?.includes(userId) && ownerEmail) {
          sharingFolders.push({ ownerId, ownerEmail, folderUrl });
        }
      }
    }

    return sharingFolders;
  }
}

export default DynamoClient;