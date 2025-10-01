import { randomUUID } from "crypto";
import { exit } from "process";
import axios, { AxiosError } from "axios";
import Promise from "bluebird";
import chalk from "chalk";
import type { GaxiosResponse } from "gaxios";
import type { drive_v3 } from "googleapis";
import queryString from "query-string";
import AddOnApiHelper from "../../../lib/addonApiHelper";
import { Logger } from "../../../lib/logger";
import { errorHandler } from "../../exceptions";
import { createFolder, getAuthedDrive, preprocessBaseURL } from "./utils";

type DrupalImportParams = {
  baseUrl: string;
  siteId: string;
  verbose: boolean;
  publish: boolean;
};

interface DrupalPost {
  id: string;
  attributes?: {
    body?: {
      processed: string;
    };
    title: string;
  };
  relationships: {
    field_author: {
      data: {
        id: string;
      };
    };
    field_topics?: {
      data: [
        {
          id: string;
        },
      ];
    };
  };
}

interface DrupalTopic {
  id: string;
  attributes?: {
    name: string;
  };
}

interface DrupalIncludedData {
  id: string;
  attributes?: {
    name: string;
    title: string;
  };
}

async function getDrupalPosts(url: string) {
  try {
    console.log(`Importing from ${url}`);
    const result = (await axios.get(url)).data;

    return {
      nextURL: result.links?.next?.href,
      posts: result.data,
      includedData: result.included,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export const importFromDrupal = errorHandler<DrupalImportParams>(
  async ({ baseUrl, siteId, verbose, publish }: DrupalImportParams) => {
    const logger = new Logger();
    const processedBaseURL = preprocessBaseURL(baseUrl);

    if (!processedBaseURL) {
      logger.error(
        chalk.red(`ERROR: Value provided for \`baseUrl\` is not a valid URL. `),
      );
      exit(1);
    }

    // Get site details
    const site = await AddOnApiHelper.getSite(siteId);

    const tokens = await AddOnApiHelper.getGoogleTokens({
      scopes: ["https://www.googleapis.com/auth/drive.file"],
      email: site.accessorAccount,
    });

    const drive = getAuthedDrive(tokens);

    const folder = await createFolder(
      drive,
      `Content Publisher Import from Drupal on ${new Date().toLocaleDateString()} unique id: ${randomUUID()}`,
    );

    if (!folder?.id) {
      logger.error(
        chalk.red(
          `Failed to create parent folder which we would have imported posts into`,
        ),
      );
      exit(1);
    }

    // Get results.
    let page = 0;
    const { url, query } = queryString.parseUrl(processedBaseURL);
    query.include = "field_author,field_topics";
    const allPosts: DrupalPost[] = [];
    const allIncludedData: DrupalIncludedData[] = [];
    let nextURL = queryString.stringifyUrl({ url, query });

    do {
      const drupalData = await getDrupalPosts(nextURL);
      nextURL = drupalData.nextURL;

      if (drupalData.posts?.length) {
        allPosts.push(...drupalData.posts);
      }

      if (drupalData.includedData?.length) {
        allIncludedData.push(...drupalData.includedData);
      }
    } while (nextURL != null && ++page < 1000);

    logger.log(
      chalk.green(`Retrieved ${allPosts.length} posts after ${page} pages`),
    );

    // Ensure that these metadata fields exist.
    await AddOnApiHelper.addSiteMetadataField(
      siteId,
      "blog",
      "drupalId",
      "text",
    );
    await AddOnApiHelper.addSiteMetadataField(siteId, "blog", "author", "text");

    await Promise.map(
      allPosts,
      async (post) => {
        if (post?.attributes?.body == null) {
          console.log("Skipping post", Object.keys(post));
          return;
        }

        // Create the google doc.
        const authorName: string | undefined = allIncludedData.find(
          (x) => x.id === post.relationships.field_author.data.id,
        )?.attributes?.title;

        const res = (await drive.files.create({
          requestBody: {
            // Name from the article.
            name: post.attributes.title,
            mimeType: "application/vnd.google-apps.document",
            parents: [folder.id as string],
          },
          media: {
            mimeType: "text/html",
            body: post.attributes.body.processed,
          },
        })) as GaxiosResponse<drive_v3.Schema$File>;
        const fileId = res.data.id;

        if (!fileId) {
          throw new Error(`Failed to create file for ${post.attributes.title}`);
        }

        // Add it to the Content Publisher site.
        await AddOnApiHelper.getDocumentWithGoogle(
          fileId,
          site.accessorAccount,
          true,
        );

        try {
          await AddOnApiHelper.updateDocument(
            fileId,
            site,
            post.attributes.title,
            post.relationships.field_topics?.data
              ?.map(
                (topic: DrupalTopic) =>
                  allIncludedData.find((x) => x.id === topic.id)?.attributes
                    ?.name,
              )
              .filter((x: string | undefined): x is string => x != null) || [],
            {
              author: authorName,
              drupalId: post.id,
            },
            verbose,
          );

          if (publish) {
            await AddOnApiHelper.publishDocument(fileId, site.accessorAccount);
          }
        } catch (e) {
          console.error(e instanceof AxiosError ? e.response?.data : e);
          throw e;
        }
      },
      {
        concurrency: 20,
      },
    );

    logger.log(
      chalk.green(
        `Successfully imported ${allPosts.length} documents into ${folder.name}`,
      ),
    );
  },
);
