import { SmartComponentMapZod } from "@pantheon-systems/cpub-sdk-core/types";
import ora from "ora";
import queryString from "query-string";
import {
  HTTPNotFound,
  IncorrectAccount,
  UserNotLoggedIn,
} from "../cli/exceptions";
import { getApiConfig } from "./apiConfig";
import { Auth0Provider, PersistedTokens } from "./auth";
import { toKebabCase } from "./utils";

export class HttpError extends Error {
  status: number;
  responseData: unknown;
  constructor(status: number, responseData: unknown) {
    const message =
      typeof responseData === "object" &&
      responseData &&
      "message" in responseData
        ? (responseData as { message: string }).message
        : `HTTP ${status}`;
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.responseData = responseData;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    params?: Record<string, unknown>;
  } = {},
): Promise<{ data: T; response: Response }> {
  let fullUrl = url;
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null) {
        searchParams.set(
          key,
          typeof val === "object" ? JSON.stringify(val) : String(val),
        );
      }
    }
    const qs = searchParams.toString();
    if (qs) fullUrl += (fullUrl.includes("?") ? "&" : "?") + qs;
  }
  const resp = await fetch(fullUrl, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body != null ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(options.body != null ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!resp.ok) {
    const text = await resp.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }
    throw new HttpError(resp.status, responseData);
  }
  const data =
    resp.status === 204 ? (undefined as T) : ((await resp.json()) as T);
  return { data, response: resp };
}

interface Auth0Config {
  clientId: string;
  redirectUri: string;
  issuerBaseUrl: string;
  audience: string;
}

class AddOnApiHelper {
  static async getCurrentTime(): Promise<number> {
    try {
      const resp = await apiFetch<{ timestamp: string }>(
        `${(await getApiConfig()).addOnApiEndpoint}/ping`,
      );
      return Number(resp.data.timestamp);
    } catch {
      return Date.now();
    }
  }

  static async getAuth0Config(): Promise<Auth0Config> {
    const apiConfig = await getApiConfig();
    const resp = await apiFetch<Auth0Config>(
      `${apiConfig.AUTH0_ENDPOINT}/config`,
    );
    return resp.data;
  }

  static async getAuth0Tokens(): Promise<PersistedTokens> {
    const provider = new Auth0Provider();
    let tokens = await provider.getTokens();
    if (tokens) return tokens;

    ora().clear();
    await provider.login();
    tokens = await provider.getTokens();
    if (tokens) return tokens;

    throw new UserNotLoggedIn();
  }
  static async getAccessTokenForAccount(
    accountId: string,
  ): Promise<{ accessToken: string; expiresAt: string }> {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();
    try {
      const resp = await apiFetch<{ accessToken: string; expiresAt: string }>(
        `${(await getApiConfig()).ACCOUNT_ENDPOINT}/${accountId}/get-access-token`,
        {
          headers: {
            Authorization: `Bearer ${auth0AccessToken}`,
          },
        },
      );
      return resp.data;
    } catch {
      throw new Error(
        "Unable to retrieve credentials for this account. " +
          "This can happen if the account was connected before credential storage was introduced. " +
          "Please disconnect and reconnect the account to resolve this.",
      );
    }
  }

  static async getConnectedAccountAccessToken(email: string): Promise<string> {
    const accounts = await this.listAccounts();
    const account = accounts.find((a) => a.accountEmail === email);
    if (!account) {
      throw new Error(
        `No connected account found for ${email}. Please run 'cpub account connect' first.`,
      );
    }
    const { accessToken } = await this.getAccessTokenForAccount(account.id);
    return accessToken;
  }

  static async getDocumentWithAuth0(
    documentId: string,
    insertIfMissing = false,
    withSiteData = false,
    title?: string,
  ): Promise<Article> {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();
    const resp = await apiFetch<Article>(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}`,
      {
        params: {
          withSiteData: withSiteData ? "true" : "false",
          ...(insertIfMissing && { insertIfMissing }),
          ...(title && {
            withMetadata: { title, slug: toKebabCase(title) },
          }),
        },
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
        },
      },
    );

    return resp.data;
  }
  static async getDocument(
    documentId: string,
    insertIfMissing = false,
    withSiteData = false,
    title?: string,
  ): Promise<Article> {
    return this.getDocumentWithAuth0(
      documentId,
      insertIfMissing,
      withSiteData,
      title,
    );
  }

  static async addSiteMetadataField(
    siteId: string,
    contentType: string,
    fieldTitle: string,
    fieldType: string,
  ): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/metadata`,
      {
        method: "POST",
        body: {
          contentType,
          field: {
            title: fieldTitle,
            type: fieldType,
          },
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async updateDocument(
    documentId: string,
    site: Site,
    title: string,
    tags: string[],
    metadataFields: {
      [key: string]: string | number | boolean | undefined | null;
    } | null,

    verbose?: boolean,
  ): Promise<Article> {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();
    const connectedAccountToken = await this.getConnectedAccountAccessToken(
      site.accessorAccount,
    );

    if (verbose) {
      console.log("update document", {
        documentId,
        siteId: site.id,
        title,
        tags,
        metadataFields,
      });
    }

    const resp = await apiFetch<Article>(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}`,
      {
        method: "PATCH",
        body: {
          siteId: site.id,
          tags,
          title,
          ...(metadataFields && {
            metadataFields,
          }),
        },
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "oauth-token": connectedAccountToken,
        },
      },
    );

    return resp.data;
  }

  static async publishDocument(documentId: string) {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();

    const {
      site: { accessorAccount },
    } = await this.getDocumentWithAuth0(documentId, false, true);
    const connectedAccountToken =
      await this.getConnectedAccountAccessToken(accessorAccount);

    const resp = await apiFetch<{ url: string }>(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}/publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "oauth-token": connectedAccountToken,
        },
      },
    );

    const publishUrl = resp.data.url;

    try {
      const { response } = await apiFetch(publishUrl);
      console.log("Published to ", response.url);
    } catch (e) {
      if (e instanceof HttpError) console.error(e, e.status, e.message);
      throw e;
    }
  }

  static async previewFile(
    docId: string,
    {
      baseUrl,
    }: {
      baseUrl?: string;
    },
  ): Promise<string> {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();

    const {
      site: { accessorAccount },
    } = await this.getDocumentWithAuth0(docId, false, true);
    const connectedAccountToken =
      await this.getConnectedAccountAccessToken(accessorAccount);

    const resp = await apiFetch<{ url: string }>(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${docId}/preview`,
      {
        method: "POST",
        body: {
          baseUrl,
        },
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "oauth-token": connectedAccountToken,
        },
      },
    );

    return resp.data.url;
  }

  static async createApiKey({
    siteId,
  }: { siteId?: string } = {}): Promise<string> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<{ apiKey: string }>(
      (await getApiConfig()).API_KEY_ENDPOINT,
      {
        method: "POST",
        body: {
          siteId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return resp.data.apiKey;
  }

  static async listAccounts(): Promise<Account[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<Account[]>(
      (await getApiConfig()).ACCOUNT_ENDPOINT,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data;
  }

  static async listApiKeys(): Promise<ApiKey[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<ApiKey[]>(
      (await getApiConfig()).API_KEY_ENDPOINT,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data;
  }

  static async revokeApiKey(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    try {
      await apiFetch(`${(await getApiConfig()).API_KEY_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404)
        throw new HTTPNotFound();
    }
  }

  static async createSite(url: string, accountEmail: string): Promise<string> {
    const accounts = await AddOnApiHelper.listAccounts();
    const accountId = accounts.find((a) => a.accountEmail === accountEmail)?.id;
    if (!accountId) throw new IncorrectAccount();

    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<{ id: string }>(
      (await getApiConfig()).SITE_ENDPOINT,
      {
        method: "POST",
        body: { name: "", url, emailList: "", accountId },
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
        },
      },
    );
    return resp.data.id;
  }

  static async deleteSite(
    id: string,
    transferToSiteId: string | null | undefined,
    force: boolean,
  ): Promise<string> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<{ id: string }>(
      queryString.stringifyUrl({
        url: `${(await getApiConfig()).SITE_ENDPOINT}/${id}`,
        query: {
          transferToSiteId,
          force,
        },
      }),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return resp.data.id;
  }

  static async listSites({
    withConnectionStatus,
  }: {
    withConnectionStatus?: boolean;
  }): Promise<Site[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<Site[]>((await getApiConfig()).SITE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        withConnectionStatus,
      },
    });

    return resp.data;
  }

  static async getSite(siteId: string): Promise<Site> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<Site>(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data;
  }

  static async updateSite(id: string, url: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}`, {
      method: "PATCH",
      body: { url },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async getServersideComponentSchema(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async pushComponentSchema(
    id: string,
    componentSchema: typeof SmartComponentMapZod,
  ): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`, {
      method: "POST",
      body: {
        componentSchema,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async removeComponentSchema(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async listAdmins(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data as void;
  }

  static async addAdmin(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`, {
      method: "PATCH",
      body: {
        email,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // fetch body on DELETE may be ignored in some environments — if issues arise, move email to query params
  static async removeAdmin(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`, {
      method: "DELETE",
      body: {
        email,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async listCollaborators(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data as void;
  }

  static async addCollaborator(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        method: "PATCH",
        body: {
          email,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  // fetch body on DELETE may be ignored in some environments — if issues arise, move email to query params
  static async removeCollaborator(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await apiFetch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        method: "DELETE",
        body: {
          email,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async updateSiteConfig(
    id: string,
    {
      url,
      webhookUrl,
      webhookSecret,
      preferredEvents,
    }: {
      url?: string;
      webhookUrl?: string;
      webhookSecret?: string;
      preferredEvents?: string[];
    },
  ): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const configuredWebhook = webhookUrl || webhookSecret || preferredEvents;

    await apiFetch(`${(await getApiConfig()).SITE_ENDPOINT}/${id}`, {
      method: "PATCH",
      body: {
        ...(url && { url: url }),
        ...(configuredWebhook && {
          webhookConfig: {
            ...(webhookUrl && { webhookUrl: webhookUrl }),
            ...(webhookSecret && { webhookSecret: webhookSecret }),
            ...(preferredEvents && { preferredEvents }),
          },
        }),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async fetchWebhookLogs(
    siteId: string,
    {
      limit,
      offset,
    }: {
      limit?: number;
      offset?: number;
    },
  ) {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<WebhookDeliveryLog[]>(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/webhookLogs`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit,
          offset,
        },
      },
    );

    return resp.data;
  }

  static async fetchAvailableWebhookEvents(siteId: string) {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await apiFetch<string[]>(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/availableWebhookEvents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data;
  }
}

export default AddOnApiHelper;
