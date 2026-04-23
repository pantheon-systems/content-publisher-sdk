import { getConfigDetails } from "./localStorage";

export enum TargetEnvironment {
  production = "production",
  staging = "staging",
  test = "test",
}

type ApiConfig = {
  addOnApiEndpoint: string;
  dashboardUrl: string;
  playgroundUrl: string;
};

const apiConfigMap: { [key in TargetEnvironment]: ApiConfig } = {
  [TargetEnvironment.production]: {
    addOnApiEndpoint: "https://api.content.pantheon.io",
    dashboardUrl: "https://content.pantheon.io",
    playgroundUrl: "https://live-collabcms-fe-demo.appa.pantheon.site",
  },
  [TargetEnvironment.staging]: {
    addOnApiEndpoint: "https://api.staging.content.pantheon.io",
    dashboardUrl: "https://staging.content.pantheon.io",
    playgroundUrl: "https://multi-staging-collabcms-fe-demo.appa.pantheon.site",
  },
  [TargetEnvironment.test]: {
    addOnApiEndpoint: "https://test-jest.example/addOnApi",
    dashboardUrl: "https://test-dashboard.example",
    playgroundUrl: "https://test-playground.example",
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
  };
};
