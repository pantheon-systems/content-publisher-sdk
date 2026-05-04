import chalk from "chalk";
import dayjs from "dayjs";
import ora from "ora";
import AddOnApiHelper from "../../lib/addonApiHelper";
import { getApiConfig } from "../../lib/apiConfig";
import { printTable } from "../../lib/cliDisplay";
import { deleteGoogleAuthDetails } from "../../lib/localStorage";
import { openOAuthBridge } from "../../lib/oauthBridge";
import { errorHandler } from "../exceptions";

export const connectAccount = errorHandler<void>(async () => {
  const spinner = ora("Preparing to connect your Google account...").start();

  try {
    const { access_token: auth0AccessToken } =
      await AddOnApiHelper.getAuth0Tokens();
    const apiConfig = await getApiConfig();

    const oauthUrl = `${apiConfig.addOnApiEndpoint}/accounts/google?token=${encodeURIComponent(auth0AccessToken)}`;

    spinner.stop();
    console.log(
      chalk.yellow("Opening browser to connect your Google account..."),
    );

    const result = await openOAuthBridge({
      popupUrl: oauthUrl,
      pagePath: "/connect",
      title: "Connect Google Account",
      message: "Connecting your Google account...",
    });

    if (result.success) {
      // Clean up legacy local Google tokens
      await deleteGoogleAuthDetails().catch(() => {});

      console.log(chalk.green("Successfully connected your Google account."));
    } else if (result.error === "window_closed") {
      console.log(chalk.yellow("Account connection was cancelled."));
    } else {
      console.log(
        chalk.red(
          `Failed to connect account: ${result.error || "Unknown error"}`,
        ),
      );
    }
  } catch (e) {
    spinner.fail("Failed to connect account.");
    throw e;
  }
});

export const listAccounts = errorHandler<void>(async () => {
  const spinner = ora("Fetching list of connected accounts...").start();
  try {
    const apiKeys = await AddOnApiHelper.listAccounts();

    spinner.succeed("Successfully fetched list of accounts.");
    if (apiKeys.length === 0) {
      console.log(chalk.yellow("No accounts found."));
      return;
    }

    printTable(
      apiKeys.map((item) => {
        return {
          "Account Email": item.accountEmail,
          Name: item.name,
          "Connected At": dayjs(item.created).format("DD MMM YYYY, hh:mm A"),
        };
      }),
    );
  } catch (e) {
    spinner.fail();
    throw e;
  }
});

export const ACCOUNT_EXAMPLES = [
  { description: "List connected accounts", command: "$0 account list" },
  { description: "Connect new account", command: "$0 account connect" },
];
