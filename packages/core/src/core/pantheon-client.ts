import type { NormalizedCacheObject } from "@apollo/client";
import { createClient } from "graphql-ws";
import {
  ApolloClient,
  ApolloLink,
  getMainDefinition,
  GraphQLWsLink,
  HttpLink,
  InMemoryCache,
  split,
} from "../lib/apollo-client";
import { axiosFetch } from "../lib/axios-fetch-adapter";
import { DefaultLogger, Logger, NoopLogger } from "../lib/logger";

export type PantheonClientConfig = {
  debug?: boolean;
  pccHost?: string;
  /**
   * ID of the site you want to query
   * @example
   * // If your site ID is 12345
   * const pantheonClient = new PantheonClient({
   *   siteId: '12345',
   *   apiKey: 'ABC-DEF',
   * });
   */
  siteId: string;
  /**
   * Token for your PCC Workspace
   * @example
   * // If your Token is ABC-DEF
   * const pantheonClient = new PantheonClient({
   *   siteId: '12345',
   *   token: 'ABC-DEF',
   * });
   */
  token?: string;

  /**
   * @deprecated Use `token` instead
   */
  apiKey?: string;

  /**
   * Optional parameter to provide a PCC Grant in place of a Token.
   * Useful for preventing preview content from being viewed publicly.
   * Any preview links generated from the add-on will include a PCC Grant.
   * Provide it here to ensure that only users with the preview link can view the content.
   *
   * @example
   * const pantheonClient = new PantheonClient({
   *  siteId: '12345',
   *  pccGrant: 'pcc_grant ABC-DEF',
   * });
   */
  pccGrant?: string;
} & ({ token: string } | { apiKey: string } | { pccGrant: string });

export class PantheonClient {
  public host: string;
  public siteId: string;
  public apiKey: string | undefined;
  public logger: Logger;
  public apolloClient: ApolloClient<NormalizedCacheObject>;

  private debug: boolean;
  private wsHost: string;

  constructor(config: PantheonClientConfig) {
    // Allow the user to override the PCC host, but this would only be done
    // by the Pantheon team when testing staging or local dev backend environments.
    // It defaults to our production API endpoint. In a future release it will
    // be a more human-friendly URL.
    const pccHost =
      config.pccHost?.replace(/\/(?<=\/)\/*$/, "") ||
      "https://gql.prod.pcc.pantheon.io";

    this.host = pccHost;
    this.wsHost = pccHost.replace(/^http/, "ws").replace(/^https/, "wss");
    this.siteId = config.siteId;
    this.debug = !!config.debug;
    this.logger = this.debug ? DefaultLogger : NoopLogger;

    this.apiKey = undefined;
    if (config.pccGrant) {
      if (config.pccGrant.includes("pcc_grant ")) {
        this.apiKey = config.pccGrant;
      } else {
        this.apiKey = `pcc_grant ${config.pccGrant}`;
      }
    } else if (config.token) {
      this.apiKey = config.token;
    } else if (config.apiKey) {
      this.apiKey = config.apiKey;
    }

    if (!this.host) {
      throw new Error("Missing Pantheon Content Publisher host");
    }

    if (!this.siteId) {
      throw new Error("Missing Pantheon Content Publisher site ID");
    }

    if (!this.apiKey) {
      throw new Error("Missing Pantheon Content Publisher Token");
    }

    const wsLink =
      typeof window !== "undefined"
        ? new GraphQLWsLink(
            createClient({
              url: `${this.wsHost}/sites/${this.siteId}/query`,
              connectionParams: {
                "PCC-TOKEN": this.apiKey,
              },
            }),
          )
        : undefined;

    const httpLink = new ApolloLink((operation, forward) =>
      forward(operation).map((response) => {
        if (response.data) {
          response.data.extensions = response.extensions;
        }
        return response;
      }),
    ).concat(
      new HttpLink({
        uri: `${this.host}/sites/${this.siteId}/query`,
        headers: {
          "PCC-TOKEN": this.apiKey,
        },
        fetch: axiosFetch,
      }),
    );

    const splitLink =
      typeof window !== "undefined" && wsLink
        ? split(
            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
              );
            },
            wsLink,
            httpLink,
          )
        : httpLink;

    this.apolloClient = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: "network-only",
        },
        watchQuery: {
          fetchPolicy: "cache-and-network",
        },
      },
    });

    if (this.debug) {
      this.logger.info("PantheonClient initialized with config", config);
    }
  }
}
