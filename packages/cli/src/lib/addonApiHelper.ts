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
import { fetchWithErrorHandling } from "./fetchWithErrorHandling";
import { toKebabCase } from "./utils";

// HTTP Status codes
const HttpStatus = {
  NotFound: 404,
} as const;

interface Auth0Config {
  clientId: string;
  redirectUri: string;
  issuerBaseUrl: string;
  audience: string;
}

class AddOnApiHelper {
  static async getCurrentTime(): Promise<number> {
    try {
      const response = await fetchWithErrorHandling(
        `${(await getApiConfig()).addOnApiEndpoint}/ping`,
      );
      const data = (await response.json()) as { timestamp: number };
      return Number(data.timestamp);
    } catch {
      // If ping fails, return current time
      return Date.now();
    }
  }

  static async getAuth0Config(): Promise<Auth0Config> {
    const apiConfig = await getApiConfig();
    const response = await fetchWithErrorHandling(
      `${apiConfig.AUTH0_ENDPOINT}/config`,
    );
    return (await response.json()) as Auth0Config;
  }

  static async getAuth0Tokens(): Promise<PersistedTokens> {
    const provider = new Auth0Provider();
    let tokens = await provider.getTokens();
    if (tokens) return tokens;

    // Login user if token is not found
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
      const response = await fetchWithErrorHandling(
        `${(await getApiConfig()).ACCOUNT_ENDPOINT}/${accountId}/get-access-token`,
        {
          headers: {
            Authorization: `Bearer ${auth0AccessToken}`,
          },
        },
      );
      return (await response.json()) as {
        accessToken: string;
        expiresAt: string;
      };
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

    const url = queryString.stringifyUrl({
      url: `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}`,
      query: {
        withSiteData: withSiteData ? "true" : "false",
        ...(insertIfMissing && { insertIfMissing: "true" }),
        ...(title && {
          "withMetadata[title]": title,
          "withMetadata[slug]": toKebabCase(title),
        }),
      },
    });

    const response = await fetchWithErrorHandling(url, {
      headers: {
        Authorization: `Bearer ${auth0AccessToken}`,
      },
    });

    return (await response.json()) as Article;
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

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/metadata`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType,
          field: {
            title: fieldTitle,
            type: fieldType,
          },
        }),
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

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "oauth-token": connectedAccountToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: site.id,
          tags,
          title,
          ...(metadataFields && {
            metadataFields,
          }),
        }),
      },
    );

    return (await response.json()) as Article;
  }

  static async publishDocument(documentId: string) {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();

    const {
      site: { accessorAccount },
    } = await this.getDocumentWithAuth0(documentId, false, true);
    const connectedAccountToken =
      await this.getConnectedAccountAccessToken(accessorAccount);

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}/publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "Content-Type": "application/json",
          "oauth-token": connectedAccountToken,
        },
        body: undefined,
      },
    );

    const data = (await response.json()) as { url: string };
    const publishUrl = data.url;

    try {
      const publishResponse = await fetch(publishUrl);

      // Get the published URL from the final redirect
      console.log("Published to ", publishResponse.url);
    } catch (e) {
      console.error(e);
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

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${docId}/preview`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "Content-Type": "application/json",
          "oauth-token": connectedAccountToken,
        },
        body: JSON.stringify({ baseUrl }),
      },
    );

    const data = (await response.json()) as { url: string };
    return data.url;
  }

  static async createApiKey({
    siteId,
  }: { siteId?: string } = {}): Promise<string> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      (await getApiConfig()).API_KEY_ENDPOINT,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId,
        }),
      },
    );
    const data = (await response.json()) as { apiKey: string };
    return data.apiKey;
  }

  static async listAccounts(): Promise<Account[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      (await getApiConfig()).ACCOUNT_ENDPOINT,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return (await response.json()) as Account[];
  }

  static async listApiKeys(): Promise<ApiKey[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      (await getApiConfig()).API_KEY_ENDPOINT,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return (await response.json()) as ApiKey[];
  }

  static async revokeApiKey(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    try {
      await fetchWithErrorHandling(
        `${(await getApiConfig()).API_KEY_ENDPOINT}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (err) {
      if ((err as { status?: number }).status === HttpStatus.NotFound)
        throw new HTTPNotFound();
    }
  }

  static async createSite(url: string, accountEmail: string): Promise<string> {
    const accounts = await AddOnApiHelper.listAccounts();
    const accountId = accounts.find((a) => a.accountEmail === accountEmail)?.id;
    if (!accountId) throw new IncorrectAccount();

    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      (await getApiConfig()).SITE_ENDPOINT,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "", url, emailList: "", accountId }),
      },
    );
    const data = (await response.json()) as { id: string };
    return data.id;
  }

  static async deleteSite(
    id: string,
    transferToSiteId: string | null | undefined,
    force: boolean,
  ): Promise<string> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
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
    const data = (await response.json()) as { id: string };
    return data.id;
  }

  static async listSites({
    withConnectionStatus,
  }: {
    withConnectionStatus?: boolean;
  } = {}): Promise<Site[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const url = queryString.stringifyUrl({
      url: (await getApiConfig()).SITE_ENDPOINT,
      query: {
        ...(withConnectionStatus != null && { withConnectionStatus }),
      },
    });

    const response = await fetchWithErrorHandling(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return (await response.json()) as Site[];
  }

  static async getSite(siteId: string): Promise<Site> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return (await response.json()) as Site;
  }

  static async updateSite(id: string, url: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      },
    );
  }

  static async getServersideComponentSchema(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async pushComponentSchema(
    id: string,
    componentSchema: typeof SmartComponentMapZod,
  ): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          componentSchema,
        }),
      },
    );
  }

  static async removeComponentSchema(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async listAdmins(id: string): Promise<unknown> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return await response.json();
  }

  static async addAdmin(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      },
    );
  }

  static async removeAdmin(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );
  }

  static async listCollaborators(id: string): Promise<unknown> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return await response.json();
  }

  static async addCollaborator(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      },
    );
  }

  static async removeCollaborator(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
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

    await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(url && { url: url }),
          ...(configuredWebhook && {
            webhookConfig: {
              ...(webhookUrl && { webhookUrl: webhookUrl }),
              ...(webhookSecret && { webhookSecret: webhookSecret }),
              ...(preferredEvents && { preferredEvents }),
            },
          }),
        }),
      },
    );
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

    const url = queryString.stringifyUrl({
      url: `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/webhookLogs`,
      query: { limit, offset },
    });

    const response = await fetchWithErrorHandling(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return (await response.json()) as WebhookDeliveryLog[];
  }

  static async fetchAvailableWebhookEvents(siteId: string) {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const response = await fetchWithErrorHandling(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/availableWebhookEvents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return (await response.json()) as string[];
  }
}

export { fetchWithErrorHandling } from "./fetchWithErrorHandling";
export default AddOnApiHelper;
