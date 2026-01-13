import queryString from "query-string";
import {
  getArticleBySlugOrId,
  getArticleURLFromSite,
  getSite,
  PCCConvenienceFunctions,
} from "../helpers";
import { parseJwt } from "../lib/jwt";
import {
  Article,
  MetadataGroup,
  PublishingLevel,
  Site,
  SmartComponentMap,
} from "../types";
import { PantheonClient, PantheonClientConfig } from "./pantheon-client";

export interface ApiRequest {
  /**
   * The query string parameters.
   */
  query: Record<string, string | string[] | undefined>;

  /**
   * Object containing cookies sent with the request.
   */
  cookies?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  /**
   * Function to set a header on the api response.
   */
  setHeader: (
    key: string,
    value: string | string[],
  ) => Promise<ApiResponse> | unknown;
  /**
   * Function to get a header set on the api response.
   */
  getHeader: (key: string) => HeaderValue | Promise<HeaderValue>;
  /**
   * Function to return a redirect response.
   */
  redirect: (status: number, path: string) => Promise<ApiResponse> | unknown;
  /**
   * Function to return a JSON response.
   */
  json: (data: string | object | unknown) => Promise<ApiResponse> | unknown;

  // headers: Record<string, string>;
  // params?: undefined;
}

type HeaderValue = string | string[] | number | undefined;

export interface PantheonAPIOptions {
  /**
   * A function that takes a PCC article ID (or and the site) and returns the path on your site
   * where the article is hosted.
   *
   * @example
   * // For a blog with articles hosted at /posts this function will be
   * (article) => `/posts/${article.id}`
   *
   * @default (article) => `/articles/${article.id}` (if not provided)
   *
   */
  resolvePath?: (
    article: Partial<Article> & Pick<Article, "id">,
    site: Site | undefined,
  ) => string;
  /**
   * A function which returns the PCC site id currently in use.
   */
  getSiteId?: () => string;

  /**
   * Return the canonical path for previewing a component
   * given the component's name.
   */
  componentPreviewPath?: (componentName: string) => string;

  /**
   * The path to redirect to if the article is not found.
   * @default "/404"
   */
  notFoundPath?: string;

  /**
   * A function which can be called in order to retrieve
   * a PantheonClient instance. It is only called as needed.
   *
   */
  getPantheonClient?: (props?: Partial<PantheonClientConfig>) => PantheonClient;

  /**
   * Map of smart component names to their schemas.
   */
  smartComponentMap?: SmartComponentMap;

  /**
   * Metadata groups, schemas, and how to retrieve their data.
   */
  metadataGroups?: MetadataGroup[];
}

export interface PantheonAPIStatus {
  timestamp: string;
  level: "basic" | "debug";
  siteId: string;
  smartComponents: boolean;
  smartComponentsCount: number | null;
  smartComponentPreview: boolean;
  metadataGroups: boolean;
  metadataGroupIdentifiers: string[] | null;
  resolvePathConfigured: boolean;
  notFoundPath: string;
}

const defaultOptions = {
  getPantheonClient: (props?: Partial<PantheonClientConfig>) =>
    PCCConvenienceFunctions.buildPantheonClient({
      isClientSide: false,
      ...props,
    }),
  resolvePath: getArticleURLFromSite,
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  getSiteId: () => process.env.PCC_SITE_ID as string,
  notFoundPath: "/404",
} satisfies PantheonAPIOptions;

type AllowablePublishingLevels = keyof typeof PublishingLevel | undefined;

export const PantheonAPI = (givenOptions?: PantheonAPIOptions) => {
  const options = {
    ...defaultOptions,
    ...givenOptions,
  };

  const buildStatus = (levelParam?: string) => {
    // We could expand with more detailed status information based on the level.
    const level = levelParam === "debug" ? "debug" : "basic";
    const timestamp = new Date().toISOString();

    return {
      timestamp,
      level,
      siteId: options.getSiteId(),
      smartComponents: Boolean(options?.smartComponentMap),
      smartComponentsCount: options?.smartComponentMap
        ? Object.keys(options.smartComponentMap).length
        : null,
      smartComponentPreview: Boolean(options?.componentPreviewPath),
      metadataGroups: Array.isArray(options?.metadataGroups)
        ? options.metadataGroups.length > 0
        : false,
      metadataGroupIdentifiers: Array.isArray(options?.metadataGroups)
        ? options.metadataGroups.map((x) => x.groupIdentifier)
        : null,
      resolvePathConfigured: typeof options?.resolvePath === "function",
      notFoundPath: options?.notFoundPath,
    } satisfies PantheonAPIStatus;
  };

  const handler = async (req: ApiRequest, res: ApiResponse) => {
    // Allow the external Pantheon system to access these API routes.
    await res.setHeader("Access-Control-Allow-Origin", "*");

    const { command: commandInput, pccGrant, ...restOfQuery } = req.query;
    const { publishingLevel, versionId } = restOfQuery;

    if (!commandInput) {
      return await res.redirect(302, options?.notFoundPath || "/404");
    }

    const currentCommand = Array.isArray(commandInput)
      ? commandInput
      : typeof commandInput === "string"
        ? commandInput.split("/")
        : [commandInput];

    // Set or delete the PCC-GRANT cookie.
    if (pccGrant) {
      await setCookie(
        res,
        `PCC-GRANT=${pccGrant}; Path=/; SameSite=None;Secure;`,
      );
    } else if (
      options?.getSiteId != null &&
      req.cookies?.["PCC-GRANT"] != null
    ) {
      try {
        const resolvedSiteId = options.getSiteId();
        const pccGrantFromCookie = parseJwt(
          req.cookies["PCC-GRANT"].toString(),
        );

        // Remove the grant cookie if it was set for a different site.
        if (
          resolvedSiteId != null &&
          // Only apply this auto-delete logic if the grant was created with a siteid.
          pccGrantFromCookie.siteId != null &&
          pccGrantFromCookie.siteId !== resolvedSiteId
        ) {
          await setCookie(
            res,
            `PCC-GRANT=deleted; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          );
        }
      } catch {
        // noop
      }
    }

    switch (currentCommand[0]) {
      case "status": {
        const levelParam = Array.isArray(req.query.level)
          ? req.query.level[0]
          : req.query.level?.toString();
        const status = buildStatus(levelParam);
        return await res.json(status);
      }

      case "document": {
        const parsedArticleId = currentCommand[1];

        const client = options.getPantheonClient({
          pccGrant: pccGrant ? pccGrant.toString() : undefined,
        });

        const [article, site] = await Promise.all([
          parsedArticleId == null
            ? null
            : await getArticleBySlugOrId(
                client,
                parsedArticleId,
                // We will let downstream validate the publishingLevel param.
                {
                  publishingLevel: publishingLevel
                    ?.toString()
                    .toUpperCase() as AllowablePublishingLevels,
                  versionId: versionId?.toString(),
                },
              ),
          client && !client.apiKey?.startsWith("pcc_grant")
            ? // Fetching the site is not available when the client is using a PCC grant.
              getSite(client, client.siteId)
            : undefined,
        ]);

        if (article == null) {
          return res.redirect(302, options.notFoundPath);
        }
        const resolvedPath = options.resolvePath(article, site);

        const queryParams = {
          pccGrant: pccGrant?.toString(),
          publishingLevel: publishingLevel?.toString().toUpperCase(),
          versionId: versionId?.toString(),
        };

        return await res.redirect(
          302,
          queryString.stringifyUrl({ url: resolvedPath, query: queryParams }),
        );
      }

      case "component_schema": {
        const componentFilter = currentCommand[1];

        if (options?.smartComponentMap == null) {
          return await res.redirect(302, options.notFoundPath);
        } else if (componentFilter == null) {
          // Return entire schema if no filter was given.
          return await res.json(options?.smartComponentMap);
        } else {
          return await res.json(
            options?.smartComponentMap[componentFilter.toUpperCase()],
          );
        }
      }

      case "component": {
        if (options?.componentPreviewPath && currentCommand[1] != null) {
          const previewPath = options.componentPreviewPath(currentCommand[1]);
          const pathParts = previewPath.split("?");
          const query = queryString.parse(pathParts[1] || "");

          return await res.redirect(
            302,
            `${pathParts[0]}?${queryString.stringify({
              ...restOfQuery,
              ...query,
            })}`,
          );
        }

        return await res.redirect(302, options.notFoundPath);
      }

      case "metadata_group": {
        const groupIdentifier = currentCommand[1];
        const objectId = currentCommand[2];

        if (options.metadataGroups == null) {
          return res.json({
            error: "This collection has no metadata groups defined.",
          });
        }

        if (groupIdentifier == null) {
          return res.json({
            rows: await Promise.all(
              options.metadataGroups.map(
                async ({ label, groupIdentifier, schema, list }) => ({
                  label,
                  groupIdentifier,
                  schema,
                  values:
                    restOfQuery.hydrate === "true" ? await list() : undefined,
                }),
              ),
            ),
          });
        }

        const group = await options.metadataGroups.find(
          (x) => x.groupIdentifier === groupIdentifier,
        );

        if (!group) {
          return res.json({
            error: "Could not find matching group by given identifier.",
          });
        }

        if (!objectId) {
          return res.json({
            rows: await group.list(),
          });
        }

        return res.json({
          row: await group.get(objectId),
        });
      }

      default: {
        return await res.redirect(302, options.notFoundPath);
      }
    }
  };

  return {
    handler,
    buildStatus,
    options,
  };
};

export async function setCookie(res: ApiResponse, value: string) {
  const previous = res.getHeader("Set-Cookie");

  await res.setHeader(`Set-Cookie`, [
    ...(typeof previous === "string"
      ? [previous]
      : Array.isArray(previous)
        ? previous
        : []),
    value,
  ]);
}
