import { getConfigDetails } from "./localStorage";

export enum TargetEnvironment {
  production = "production",
  staging = "staging",
  test = "test",
}

type ApiConfig = {
  addOnApiEndpoint: string;
  googleClientId: string;
  googleRedirectUri: string;
  playgroundUrl: string;
};

const apiConfigMap: { [key in TargetEnvironment]: ApiConfig } = {
  [TargetEnvironment.production]: {
    addOnApiEndpoint: "https://api.content.pantheon.io",
    googleClientId:
      "432998952749-6eurouamlt7mvacb6u4e913m3kg4774c.apps.googleusercontent.com",
    googleRedirectUri: "http://localhost:3030/oauth-redirect",
    playgroundUrl: "https://live-collabcms-fe-demo.appa.pantheon.site",
  },
  [TargetEnvironment.staging]: {
    addOnApiEndpoint: "https://api.staging.content.pantheon.io",
    googleClientId:
      "142470191541-bmomms4luuhoc68g903rscgr9qa3150b.apps.googleusercontent.com",
    googleRedirectUri: "http://localhost:3030/oauth-redirect",
    playgroundUrl: "https://multi-staging-collabcms-fe-demo.appa.pantheon.site",
  },
  [TargetEnvironment.test]: {
    addOnApiEndpoint: "https://test-jest.comxyz/addOnApi",
    googleClientId: "test-google-com",
    googleRedirectUri: "http://localhost:3030/oauth-redirect",
    playgroundUrl: "https://test-playground.site",
  },
};

export const getApiConfig = async () => {
  const config = await getConfigDetails();
  const apiConfig =
    apiConfigMap[
    config?.targetEnvironment ||
    (process.env.NODE_ENV as TargetEnvironment) ||
    "production"
    ];

  return {
    ...apiConfig,

    ACCOUNT_ENDPOINT: `${apiConfig.addOnApiEndpoint}/accounts`,
    API_KEY_ENDPOINT: `${apiConfig.addOnApiEndpoint}/api-key`,
    SITE_ENDPOINT: `${apiConfig.addOnApiEndpoint}/sites`,
    DOCUMENT_ENDPOINT: `${apiConfig.addOnApiEndpoint}/articles`,
    AUTH0_ENDPOINT: `${apiConfig.addOnApiEndpoint}/auth0/`,
    OAUTH_ENDPOINT: `${apiConfig.addOnApiEndpoint}/oauth/`,
  };
};
