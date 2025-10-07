import { randomUUID } from "crypto";
import { exit } from "process";
import axios, { AxiosError } from "axios";
import Promise from "bluebird";
import chalk from "chalk";
import type { GaxiosResponse } from "gaxios";
import { drive_v3 } from "googleapis";
import queryString from "query-string";
import AddOnApiHelper from "../../../lib/addonApiHelper";
import { Logger } from "../../../lib/logger";
import { errorHandler } from "../../exceptions";
import { createFolder, getAuthedDrive, preprocessBaseURL } from "./utils";

const DEFAULT_PAGE_SIZE = 50;

interface WPPost {
  id: string;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  format: string;
  categories: number[];
  tags: number[];
  _embedded: {
    author: { id: number; name: string }[];
  };
}

interface WPTag {
  id: number;
  description: string;
  name: string;
  slug: string;
}

async function getWPPosts(url: string) {
  try {
    console.log(`Importing from ${url}`);
    const result = (await axios.get<WPPost[]>(url)).data;

    const { url: parsedURL, query } = queryString.parseUrl(url);

    let pageSize = DEFAULT_PAGE_SIZE;
    if (query.per_page != null) {
      pageSize = parseInt(query.per_page.toString(), 10);
    }

    query.pageSize = pageSize.toString();
    // Try to parse the page, otherwise start at the second page, since
    // we just processed (presumably) the first one.
    query.page = (
      query.page != null ? parseInt(query.page.toString(), 10) + 1 : 2
    ).toString();

    let nextURL: string | null = queryString.stringifyUrl({
      url: parsedURL,
      query,
    });

    // We've reached the end of pagination if the number of results
    // we received is less than the number we asked for.
    if (result.length < pageSize) {
      nextURL = null;
    }

    return {
      nextURL,
      posts: result,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function getTagInfo(baseURL: string, tags: number[]) {
  if (!tags?.length) return [];

  const { data } = await axios.get<WPTag[]>(
    new URL(`/wp-json/wp/v2/tags?include=${tags.join()}`, baseURL).href,
  );

  return data.map((x) => ({
    id: x.id,
    name: x.name,
    slug: x.slug,
    description: x.description,
  }));
}

type WordPressImportParams = {
  baseUrl: string;
  siteId: string;
  verbose: boolean;
  publish: boolean;
};

export const importFromWordPress = errorHandler<WordPressImportParams>(
  async ({ baseUrl, siteId, verbose, publish }: WordPressImportParams) => {
    const logger = new Logger();
    const processedBaseURL = preprocessBaseURL(baseUrl);

    console.log({ baseUrl, processedBaseURL });
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
      `Content Publisher Import from WordPress on ${new Date().toLocaleDateString()} unique id: ${randomUUID()}`,
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
    let page = 1;
    const { url, query } = queryString.parseUrl(processedBaseURL);
    query.per_page = DEFAULT_PAGE_SIZE.toString();
    query.page = page.toString();
    query._embed = "";
    const allPosts: WPPost[] = [];
    let nextURL: string | null = queryString.stringifyUrl({
      url: new URL("/wp-json/wp/v2/posts", url).href,
      query,
    });

    do {
      const data = await getWPPosts(nextURL);
      nextURL = data.nextURL;

      if (data.posts?.length) {
        allPosts.push(...data.posts);
      }
    } while (nextURL != null && ++page < 1000);

    logger.log(
      chalk.green(`Retrieved ${allPosts.length} posts after ${page} pages`),
    );

    // Ensure that these metadata fields exist.
    await AddOnApiHelper.addSiteMetadataField(
      siteId,
      "blog",
      "wordpressId",
      "text",
    );
    await AddOnApiHelper.addSiteMetadataField(siteId, "blog", "author", "text");

    await Promise.map(
      allPosts,
      async (post) => {
        const authorName: string | undefined = post._embedded.author
          .map((x) => x.name)
          .join(", ");

        // Create the google doc.
        const res = (await drive.files.create({
          requestBody: {
            // Name from the article.
            name: post.title.rendered,
            mimeType: "application/vnd.google-apps.document",
            parents: [folder.id as string],
          },
          media: {
            mimeType: "text/html",
            body: post.content.rendered,
          },
        })) as GaxiosResponse<drive_v3.Schema$File>;
        const fileId = res.data.id;

        if (!fileId) {
          throw new Error(`Failed to create file for ${post.title.rendered}`);
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
            post.title.rendered,
            (await getTagInfo(processedBaseURL, post.tags)).map((x) => x.name),
            {
              author: authorName,
              wordpressId: post.id,
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
