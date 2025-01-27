import * as fs from "fs";
import { exit } from "process";
import chalk from "chalk";
import { parseFromString } from "dom-parser";
import type { GaxiosResponse } from "gaxios";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import ora from "ora";
import showdown from "showdown";
import AddOnApiHelper from "../../../lib/addonApiHelper";
import { GoogleAuthProvider } from "../../../lib/auth";
import { Logger } from "../../../lib/logger";
import { errorHandler } from "../../exceptions";

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

    // Check user has required permission to create drive file
    await AddOnApiHelper.getGoogleTokens([
      "https://www.googleapis.com/auth/drive.file",
    ]);
    const provider = new GoogleAuthProvider([
      "https://www.googleapis.com/auth/drive.file",
    ]);
    const tokens = await provider.getTokens();
    if (!tokens) {
      logger.error(chalk.red(`ERROR: Failed to retrieve login details.`));
      exit(1);
    }

    // Create Google Doc
    const spinner = ora("Creating document on the Google Drive...").start();
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });
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

    // Create PCC document
    await AddOnApiHelper.getDocument(fileId, true, title);
    // Cannot set metadataFields(title,slug) in the same request since we reset metadataFields
    //  when changing the siteId.
    await AddOnApiHelper.updateDocument(
      fileId,
      siteId,
      title,
      [],
      null,
      verbose,
    );
    await AddOnApiHelper.getDocument(fileId, false, title);

    // Publish PCC document
    if (publish) {
      await AddOnApiHelper.publishDocument(fileId);
    }
    spinner.succeed(
      `Successfully created document at below path${
        publish ? " and published it on the PCC." : ":"
      }`,
    );
    logger.log(chalk.green(fileUrl, "\n"));
  },
);
