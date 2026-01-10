import { SmartComponentMapZod } from "@pantheon-systems/cpub-sdk-core/types";
import axios, { AxiosError, HttpStatusCode } from "axios";
import ora from "ora";
import queryString from "query-string";
import {
  HTTPNotFound,
  IncorrectAccount,
  UserNotLoggedIn,
} from "../cli/exceptions";
import { getApiConfig } from "./apiConfig";
import { Auth0Provider, GoogleAuthProvider, PersistedTokens } from "./auth";
import { toKebabCase } from "./utils";

interface Auth0Config {
  clientId: string;
  redirectUri: string;
  issuerBaseUrl: string;
  audience: string;
}

class AddOnApiHelper {
  static async getCurrentTime(): Promise<number> {
    try {
      const resp = await axios.get(
        `${(await getApiConfig()).addOnApiEndpoint}/ping`,
      );
      return Number(resp.data.timestamp);
    } catch {
      // If ping fails, return current time
      return Date.now();
    }
  }

  static async getAuth0Config(): Promise<Auth0Config> {
    const apiConfig = await getApiConfig();
    const resp = await axios.get(`${apiConfig.AUTH0_ENDPOINT}/config`);
    return resp.data as Auth0Config;
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
  static async getGoogleTokens(args: {
    email: string;
    scopes?: string[];
  }): Promise<PersistedTokens> {
    const { scopes, email } = args || {};
    const provider = new GoogleAuthProvider(scopes);
    let tokens = await provider.getTokens(email);
    if (tokens) return tokens;

    // Login user if token is not found
    ora().clear();
    await provider.login(email);
    tokens = await provider.getTokens(email);
    if (tokens) return tokens;

    throw new UserNotLoggedIn();
  }

  static async getDocumentWithAuth0(
    documentId: string,
    insertIfMissing = false,
    withSiteData = false,
    title?: string,
  ): Promise<Article> {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();
    const resp = await axios.get(
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

    return resp.data as Article;
  }
  static async getDocumentWithGoogle(
    documentId: string,
    accountEmail: string,
    insertIfMissing = false,
    withSiteData = false,
    title?: string,
  ): Promise<Article> {
    const { access_token: accessToken, id_token: idToken } =
      await this.getGoogleTokens({
        email: accountEmail,
      });
    const resp = await axios.get(
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
          Authorization: `Bearer ${idToken}`,
          "oauth-token": accessToken,
        },
      },
    );

    return resp.data as Article;
  }

  static async addSiteMetadataField(
    siteId: string,
    contentType: string,
    fieldTitle: string,
    fieldType: string,
  ): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.post(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/metadata`,
      {
        contentType,
        field: {
          title: fieldTitle,
          type: fieldType,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
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
    const { access_token: googleAccessToken } = await this.getGoogleTokens({
      email: site.accessorAccount,
    });

    if (verbose) {
      console.log("update document", {
        documentId,
        siteId: site.id,
        title,
        tags,
        metadataFields,
      });
    }

    const resp = await axios.patch(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}`,
      {
        siteId: site.id,
        tags,
        title,
        ...(metadataFields && {
          metadataFields,
        }),
      },
      {
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "oauth-token": googleAccessToken,
          "Content-Type": "application/json",
        },
      },
    );

    return resp.data as Article;
  }

  static async publishDocument(documentId: string, accessorAccount: string) {
    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();
    const { access_token: googleAccessToken } = await this.getGoogleTokens({
      scopes: ["https://www.googleapis.com/auth/drive.file"],
      email: accessorAccount,
    });

    const resp = await axios.post<{ url: string }>(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${documentId}/publish`,
      null,
      {
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "Content-Type": "application/json",
          "oauth-token": googleAccessToken,
        },
      },
    );

    const publishUrl = resp.data.url;

    try {
      const resp = await axios.get(publishUrl);

      // Get the published URL
      console.log("Published to ", resp.request.res.responseUrl);
    } catch (e) {
      if (e instanceof AxiosError) console.error(e, e.code, e.message);
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

    const { access_token: googleAccessToken } = await this.getGoogleTokens({
      scopes: ["https://www.googleapis.com/auth/drive"],
      email: accessorAccount,
    });

    const resp = await axios.post<{ url: string }>(
      `${(await getApiConfig()).DOCUMENT_ENDPOINT}/${docId}/preview`,
      {
        baseUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
          "Content-Type": "application/json",
          "oauth-token": googleAccessToken,
        },
      },
    );

    const previewURL = resp.data.url;

    return previewURL;
  }

  static async createApiKey({
    siteId,
  }: { siteId?: string } = {}): Promise<string> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.post(
      (await getApiConfig()).API_KEY_ENDPOINT,
      {
        siteId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return resp.data.apiKey as string;
  }

  static async connectAccount(oauthToken: string): Promise<Account> {
    const { access_token: accessToken } = await this.getAuth0Tokens();
    const resp = await axios.post(
      (await getApiConfig()).ACCOUNT_ENDPOINT,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "oauth-token": oauthToken,
        },
      },
    );

    return resp.data as Account;
  }

  static async listAccounts(): Promise<Account[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.get((await getApiConfig()).ACCOUNT_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return resp.data as Account[];
  }

  static async listApiKeys(): Promise<ApiKey[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.get((await getApiConfig()).API_KEY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return resp.data as ApiKey[];
  }

  static async revokeApiKey(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    try {
      await axios.delete(`${(await getApiConfig()).API_KEY_ENDPOINT}/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      if (
        (err as { response: { status: number } }).response.status ===
        HttpStatusCode.NotFound
      )
        throw new HTTPNotFound();
    }
  }

  static async createSite(url: string, accountEmail: string): Promise<string> {
    const accounts = await AddOnApiHelper.listAccounts();
    const accountId = accounts.find((a) => a.accountEmail === accountEmail)?.id;
    if (!accountId) throw new IncorrectAccount();

    const { access_token: auth0AccessToken } = await this.getAuth0Tokens();

    const resp = await axios.post(
      (await getApiConfig()).SITE_ENDPOINT,
      { name: "", url, emailList: "", accountId },
      {
        headers: {
          Authorization: `Bearer ${auth0AccessToken}`,
        },
      },
    );
    return resp.data.id as string;
  }

  static async deleteSite(
    id: string,
    transferToSiteId: string | null | undefined,
    force: boolean,
  ): Promise<string> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.delete(
      queryString.stringifyUrl({
        url: `${(await getApiConfig()).SITE_ENDPOINT}/${id}`,
        query: {
          transferToSiteId,
          force,
        },
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return resp.data.id as string;
  }

  static async listSites({
    withConnectionStatus,
  }: {
    withConnectionStatus?: boolean;
  }): Promise<Site[]> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.get((await getApiConfig()).SITE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        withConnectionStatus,
      },
    });

    return resp.data as Site[];
  }

  static async getSite(siteId: string): Promise<Site> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.get(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data as Site;
  }

  static async updateSite(id: string, url: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.patch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}`,
      { url },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async getServersideComponentSchema(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.get(
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

    await axios.post(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`,
      {
        componentSchema,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async removeComponentSchema(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.delete(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/components`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async listAdmins(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    return (
      await axios.get(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data;
  }

  static async addAdmin(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.patch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`,
      {
        email,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async removeAdmin(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.delete(`${(await getApiConfig()).SITE_ENDPOINT}/${id}/admins`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        email,
      },
    });
  }

  static async listCollaborators(id: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    return (
      await axios.get(
        `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
    ).data;
  }

  static async addCollaborator(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.patch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        email,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  static async removeCollaborator(id: string, email: string): Promise<void> {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    await axios.delete(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}/collaborators`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          email,
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

    await axios.patch(
      `${(await getApiConfig()).SITE_ENDPOINT}/${id}`,
      {
        ...(url && { url: url }),
        ...(configuredWebhook && {
          webhookConfig: {
            ...(webhookUrl && { webhookUrl: webhookUrl }),
            ...(webhookSecret && { webhookSecret: webhookSecret }),
            ...(preferredEvents && { preferredEvents }),
          },
        }),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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

    const resp = await axios.get(
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

    return resp.data as WebhookDeliveryLog[];
  }

  static async fetchAvailableWebhookEvents(siteId: string) {
    const { access_token: accessToken } = await this.getAuth0Tokens();

    const resp = await axios.get(
      `${(await getApiConfig()).SITE_ENDPOINT}/${siteId}/availableWebhookEvents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return resp.data as string[];
  }
}

export default AddOnApiHelper;
