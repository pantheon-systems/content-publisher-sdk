import chalk from "chalk";
import dayjs from "dayjs";
import ora from "ora";
import AddOnApiHelper from "../../../lib/addonApiHelper";
import { printTable } from "../../../lib/cliDisplay";
import { errorHandler, IncorrectAccount } from "../../exceptions";

export const createSite = errorHandler<{ url: string; accountEmail: string }>(
  async ({ url, accountEmail }) => {
    const spinner = ora("Creating site...").start();

    try {
      const siteId = await AddOnApiHelper.createSite(url, accountEmail);
      spinner.succeed(
        `Successfully created the site with given details. Id: ${siteId}`,
      );
    } catch (e) {
      if (e instanceof IncorrectAccount) {
        spinner.fail(
          "Given `accountEmail` is not connected to your user. Please connect an account first using  `cpub account connect` command.",
        );
        return;
      }
      throw e;
    }
  },
);

export const deleteSite = errorHandler<{
  id: string;
  transferToSiteId: string | null | undefined;
  force: boolean;
}>(async ({ id, transferToSiteId, force }) => {
  const spinner = ora("Deleting site...").start();
  try {
    await AddOnApiHelper.deleteSite(id, transferToSiteId, force);
    spinner.succeed(`Successfully deleted the site with id "${id}"`);
  } catch (e) {
    spinner.fail();
    throw e;
  }
});

export const listSites = errorHandler<{
  withStatus?: boolean;
}>(async ({ withStatus }) => {
  const spinner = ora("Fetching list of existing sites...").start();
  try {
    const accounts = await AddOnApiHelper.listAccounts();
    if (accounts.length === 0) {
      spinner.fail(
        "You don't have any connected accounts. Please connect at least one account using `cpub account connect` command.",
      );
      return;
    }
    const sites = await AddOnApiHelper.listSites({
      withConnectionStatus: withStatus,
    });

    spinner.succeed("Successfully fetched list of sites.");
    if (sites.length === 0) {
      console.log(chalk.yellow("No sites found."));
      return;
    }

    if (withStatus) {
      console.info(
        "\n",
        [
          chalk.underline("Legend"),
          '\n\u2022 "Frontend Connected" - Whether the site has been configured with a Pantheon SDK and can be reached at the given URL',
          '\u2022 "Smart Components" - Whether the site has been configured with Smart Component support',
          '\u2022 "Smart Component Preview" - Whether the site been configured with Smart Component preview support',
          "\n",
        ].join("\n"),
      );
    }

    printTable(
      sites.map((item) => {
        return {
          Id: item.id,
          Url: item.url || "",
          "Created At": item.created
            ? dayjs(item.created).format("DD MMM YYYY, hh:mm A")
            : "NA",
          ...(withStatus && {
            "Frontend Connected": Boolean(item?.connectionStatus?.connected),
            "Smart Components": Boolean(
              item?.connectionStatus?.capabilities?.smartComponents,
            ),
            "Smart Component Preview": Boolean(
              item?.connectionStatus?.capabilities?.smartComponentPreview,
            ),
          }),
        };
      }),
    );
  } catch (e) {
    spinner.fail();
    throw e;
  }
});

export const updateSiteConfig = errorHandler(
  async ({
    id,
    ...configurableProperties
  }: {
    id: string;
  } & Partial<
    Record<(typeof configurableSiteProperties)[number]["id"], string>
  >) => {
    const spinner = ora("Updating site...").start();

    try {
      const site = await AddOnApiHelper.getSite(id);
      if (site.__isPlayground) {
        spinner.fail("Cannot configure a playground collection.");
        return;
      }

      await AddOnApiHelper.updateSiteConfig(id, configurableProperties);
      spinner.succeed(`Successfully updated the site.`);
    } catch (e) {
      spinner.fail();
      throw e;
    }
  },
);

export const configurableSiteProperties = [
  {
    id: "url",
    command: {
      name: "url <url>",
      description: "Set url for a given site",
      type: "string",
    },
  },
  {
    id: "webhookUrl",
    command: {
      name: "webhook-url <webhookUrl>",
      description: "Set a webhook url for a given site",
      type: "string",
    },
  },
  {
    id: "webhookSecret",
    command: {
      name: "webhook-secret <webhookSecret>",
      description: "Set a webhook secret for a given site",
      type: "string",
    },
  },
  {
    id: "visibility",
    command: {
      name: "visibility <visibility>",
      description:
        "Set the collection's visibility (either 'private' or 'workspace')",
      type: "string",
    },
  },
] as const;

export const SITE_EXAMPLES = [
  {
    description: "Create new site",
    command: "$0 site create --url test-site.com",
  },
  {
    description: "Get webhooks event delivery logs for a site",
    command: "$0 site webhooks history 123456789example1234",
  },
];
