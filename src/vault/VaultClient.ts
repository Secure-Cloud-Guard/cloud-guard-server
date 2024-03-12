import vault from "node-vault";
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const vaultEndpoint = process.env.VAULT_ENDPOINT;
const username = process.env.VAULT_USERNAME;
const password = process.env.VAULT_PASS;
const kvPath = process.env.VAULT_KV_PATH as string;


class VaultClient {
  private vaultClient: vault.client;

  constructor() {
    this.vaultClient = vault({
      apiVersion: "v1",
      endpoint: vaultEndpoint,
    });

    this.vaultClient.userpassLogin({ username, password }).then(result => {
      this.vaultClient.token = result.auth.client_token;
    });
  }

  async getSSEkey(userId: string) {
    try {
      let { data } = await this.vaultClient.read(kvPath);
      const keys = data.data;
      let key = keys[userId];

      if (key) {
        return key;
      }

      key = crypto.randomBytes(32).toString('hex');
      keys[userId] = key;

      this.updateKeys(keys);
      return key;

    } catch (e) {
      throw e;
    }
  }

  private async updateKeys(keys: string) {
    await this.vaultClient.write(kvPath, { data: keys });
  }
}

export default new VaultClient();