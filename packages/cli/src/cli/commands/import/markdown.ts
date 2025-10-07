import * as fs from "fs";
import { exit } from "process";
import chalk from "chalk";
import { parseFromString } from "dom-parser";
import type { GaxiosResponse } from "gaxios";
import { drive_v3 } from "googleapis";
import ora from "ora";
import showdown from "showdown";
import AddOnApiHelper from "../../../lib/addonApiHelper";
import { Logger } from "../../../lib/logger";
import { errorHandler } from "../../exceptions";
import { getAuthedDrive } from "./utils";

const HEADING_TAGS = ["h1", "h2", "h3", "title"];

type MarkdownImportParams = {
  filePath: string;
  siteId: string;
  verbose: boolean;
  publish: boolean;
};

export const importFromMarkdown = errorHandler<MarkdownImportParams>(
  async ({ filePath, siteId, verbose, publish }: MarkdownImportParams) => {
    const logger = new Logger();

    if (!fs.existsSync(filePath)) {
      logger.error(
        chalk.red(
          `ERROR: Could not find markdown file at given path (${filePath})`,
        ),
      );
      exit(1);
    }

    // Prepare article content and title
    const content = fs.readFileSync(filePath).toString();

    // Get site details
    const site = await AddOnApiHelper.getSite(siteId);

    // Check user has required permission to create drive file
    const tokens = await AddOnApiHelper.getGoogleTokens({
      scopes: ["https://www.googleapis.com/auth/drive"],
      email: site.accessorAccount,
    });

    // Create Google Doc
    const spinner = ora("Creating document on the Google Drive...").start();

    const drive = getAuthedDrive(tokens);

    const converter = new showdown.Converter();
    const html = converter.makeHtml(content);
    const dom = parseFromString(html);

    // Derive document's title
    let title: string | undefined = undefined;
    for (const item of HEADING_TAGS) {
      const element = dom.getElementsByTagName(item)[0];
      if (element) {
        title = element.textContent;
        break;
      }
    }
    title = title || "Untitled Document";

    const res = (await drive.files.create({
      requestBody: {
        name: title,
        mimeType: "application/vnd.google-apps.document",
      },
      media: {
        mimeType: "text/html",
        body: html,
      },
    })) as GaxiosResponse<drive_v3.Schema$File>;
    const fileId = res.data.id;
    const fileUrl = `https://docs.google.com/document/d/${fileId}`;

    if (!fileId) {
      spinner.fail("Failed to create document on the Google Drive.");
      exit(1);
    }

    // Create Content Publisher document
    await AddOnApiHelper.getDocumentWithGoogle(
      fileId,
      site.accessorAccount,
      true,
      false,
      title,
    );
    // Cannot set metadataFields(title,slug) in the same request since we reset metadataFields
    //  when changing the siteId.
    await AddOnApiHelper.updateDocument(fileId, site, title, [], null, verbose);
    await AddOnApiHelper.getDocumentWithGoogle(
      fileId,
      site.accessorAccount,
      false,
      false,
      title,
    );

    // Publish Content Publisher document
    if (publish) {
      await AddOnApiHelper.publishDocument(fileId, site.accessorAccount);
    }
    spinner.succeed(
      `Successfully created document at below path${
        publish ? " and published it on the Content Publisher." : ":"
      }`,
    );
    logger.log(chalk.green(fileUrl, "\n"));
  },
);
