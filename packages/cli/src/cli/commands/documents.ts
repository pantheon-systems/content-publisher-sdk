import { exit } from "process";
import chalk from "chalk";
import AddOnApiHelper from "../../lib/addonApiHelper";
import { Logger, SpinnerLogger } from "../../lib/logger";
import { errorHandler } from "../exceptions";

type GeneratePreviewParam = {
  documentId: string;
  baseUrl: string;
};

const GDOCS_URL_REGEX =
  /^(https|http):\/\/(www.)?docs.google.com\/document\/d\/(?<id>[^/]+).*$/;

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

    const previewLink = await AddOnApiHelper.previewFile(cleanedId, {
      baseUrl,
    });

    generateLinkLogger.succeed(
      "Successfully generated preview link. Please copy it below:",
    );

    logger.log(chalk.green(previewLink));
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
