declare type CliTemplateOptions = "nextjs";

declare type Article = {
  id: string;
  siteId: string;
  title: string;
  site: Site;
};

declare type ApiKey = {
  id: string;
  keyMasked: string;
  created: string;
};

declare type Account = {
  id: string;
  name: string;
  accountEmail: string;
  userEmail: string;
  accountProvider?: string;
  created: string;
};

declare type Site = {
  id: string;
  url: string;
  created?: number;
  __isPlayground: boolean;
  connectionStatus?: {
    connected: boolean;
    capabilities: Record<string, boolean>;
  } | null;
  accessorAccount: string;
};

declare type AuthDetails = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
};

declare type PackageManager = "npm" | "pnpm" | "yarn";

declare type WebhookDeliveryLog = {
  type: "success" | "failure";
  event: string;
  payload: Record<string, unknown>;
  requestTime: number;
  responseStatus: number;
  responseDuration: number;
};
