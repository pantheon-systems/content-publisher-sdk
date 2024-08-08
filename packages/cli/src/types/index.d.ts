declare type CliTemplateOptions = "nextjs";

declare type Article = {
  id: string;
  siteId: string;
  title: string;
};

declare type ApiKey = {
  id: string;
  keyMasked: string;
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
