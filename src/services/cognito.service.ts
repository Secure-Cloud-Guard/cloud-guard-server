import CognitoClient from "../aws/CognitoClient";

const CognitoService = {
  getCurrentUser: async function(accessToken: string) {
    const cognitoClient = new CognitoClient();
    const { UserAttributes, Username } = await cognitoClient.getCurrentUser(accessToken);
    return { UserAttributes, Username };
  },

  getUser: async function(userEmail: string) {
    const cognitoClient = new CognitoClient();
    const { UserAttributes, Username } = await cognitoClient.getUser(userEmail);
    return { UserAttributes, Username };
  }
};

export default CognitoService;