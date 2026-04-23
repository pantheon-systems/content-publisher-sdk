import { exit } from "process";
import chalk from "chalk";
import AddOnApiHelper from "../../lib/addonApiHelper";
import { getApiConfig } from "../../lib/apiConfig";
import { Logger, SpinnerLogger } from "../../lib/logger";
import { openOAuthBridge } from "../../lib/oauthBridge";
import { errorHandler } from "../exceptions";

type GeneratePreviewParam = {
  documentId: string;
  baseUrl: string;
};

const GDOCS_URL_REGEX =
  /^(https|http):\/\/(www.)?docs.google.com\/document\/d\/(?<id>[^/]+).*$/;

function isCredentialsNotFoundError(e: unknown): boolean {
  const data = (
    e as {
      response?: { data?: { data?: { errorCode?: string } } };
    }
  )?.response?.data?.data;
  return data?.errorCode === "ACCOUNT_CREDENTIALS_NOT_FOUND";
}

async function promptDriveFileAccess(docId: string): Promise<boolean> {
  const apiConfig = await getApiConfig();
  const connectUrl = `${apiConfig.dashboardUrl}/articles/${docId}/connect`;

  console.log(
    chalk.yellow(
      "\nThis document requires access to be granted via the file picker.",
    ),
  );
  console.log(
    chalk.yellow("Opening browser for you to grant document access...\n"),
  );

  const result = await openOAuthBridge({
    popupUrl: connectUrl,
    pagePath: "/grant-access",
    title: "Grant Document Access",
    message: "Waiting for document access to be granted...",
  });

  return result.success;
}

export const generatePreviewLink = errorHandler<GeneratePreviewParam>(
  async ({ documentId, baseUrl }: GeneratePreviewParam) => {
    const logger = new Logger();

    let cleanedId = documentId.trim();
    const match = cleanedId.match(GDOCS_URL_REGEX);
    if (match?.groups?.id) cleanedId = match.groups.id;

    if (baseUrl) {
      try {
        new URL(baseUrl);

        // If protocol is not provided, add it for convenience
        if (baseUrl.startsWith("localhost:")) {
          baseUrl = `http://${baseUrl}`;

          // Validate again
          new URL(baseUrl);
        }
      } catch {
        logger.error(
          chalk.red(
            `ERROR: Value provided for \`baseUrl\` is not a valid URL. `,
          ),
        );
        exit(1);
      }
    }

    // Generating link
    const generateLinkLogger = new SpinnerLogger("Generating preview link");
    generateLinkLogger.start();

    try {
      const previewLink = await AddOnApiHelper.previewFile(cleanedId, {
        baseUrl,
      });

      generateLinkLogger.succeed(
        "Successfully generated preview link. Please copy it below:",
      );
      logger.log(chalk.green(previewLink));
    } catch (e) {
      if (isCredentialsNotFoundError(e)) {
        generateLinkLogger.stop();

        const granted = await promptDriveFileAccess(cleanedId);
        if (!granted) {
          logger.error(
            chalk.red("Document access was not granted. Please try again."),
          );
          exit(1);
        }

        // Retry after access was granted
        const retryLogger = new SpinnerLogger(
          "Retrying preview link generation",
        );
        retryLogger.start();

        const previewLink = await AddOnApiHelper.previewFile(cleanedId, {
          baseUrl,
        });

        retryLogger.succeed(
          "Successfully generated preview link. Please copy it below:",
        );
        logger.log(chalk.green(previewLink));
      } else {
        generateLinkLogger.fail();
        throw e;
      }
    }
  },
);
export const DOCUMENT_EXAMPLES = [
  {
    description: "Generate preview link for given document ID",
    command: "$0 document preview 1234567890example1234567890exam_ple123456789",
  },
  {
    description: "Generate preview link for given document URL",
    command:
      "$0 document preview https://docs.google.com/document/d/1234567890example1234567890exam_ple123456789",
  },
];
