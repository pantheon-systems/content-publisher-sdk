/**
 * Static helper functions for site-wide metadata.
 */

import { PantheonClient } from "../core/pantheon-client";
import { gql } from "../lib/apollo-client";
import { handleApolloError } from "./errors";

export const LIST_TAGS_QUERY = gql`
  query ListTags($id: String!) {
    site(id: $id) {
      tags
    }
  }
`;

export async function getAllTags(client: PantheonClient): Promise<string[]> {
  try {
    const { site } = (
      await client.apolloClient.query({
        query: LIST_TAGS_QUERY,
        variables: { id: client.siteId },
      })
    ).data;

    return site.tags || [];
  } catch (e) {
    handleApolloError(e);
  }
}
