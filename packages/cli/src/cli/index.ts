#!/usr/bin/env node
import ora from "ora";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { checkEnvironment } from "../lib/checkEnvironment";
import checkUpdate, { getPackageDetails } from "../lib/checkUpdate";
import { isProgramInstalled } from "../lib/utils";
import {
  ACCOUNT_EXAMPLES,
  connectAccount,
  listAccounts,
} from "./commands/accounts";
import {
  printConfigurationData,
  resetTargetEnvironment,
  setTargetEnvironment,
} from "./commands/config";
import { DOCUMENT_EXAMPLES, generatePreviewLink } from "./commands/documents";
import {
  importFromDrupal,
  importFromMarkdown,
  importFromWordPress,
} from "./commands/import";
import init, { INIT_EXAMPLES } from "./commands/init";
import login, { LOGIN_EXAMPLES } from "./commands/login";
import logout, { LOGOUT_EXAMPLES } from "./commands/logout";
import showLogs from "./commands/logs";
import {
  addAdminSchema,
  listAdminsSchema,
  removeAdminSchema,
} from "./commands/sites/admins";
import {
  addCollaborator,
  listCollaborators,
  removeCollaborator,
} from "./commands/sites/collaborators";
import {
  getComponentSchema,
  printLiveComponentSchema,
  printStoredComponentSchema,
  pushComponentSchema,
  removeStoredComponentSchema,
} from "./commands/sites/componentschema";
import {
  configurableSiteProperties,
  createSite,
  deleteSite,
  listSites,
  SITE_EXAMPLES,
  updateSiteConfig,
} from "./commands/sites/site";
import configurePreferredWebhookEvents from "./commands/sites/webhooks";
import {
  createToken,
  listTokens,
  revokeToken,
  TOKEN_EXAMPLES,
} from "./commands/token";
import printWhoAmI, { WHOAMI_EXAMPLES } from "./commands/whoAmI";
import { formatExamples } from "./examples";

const INSIDE_TEST = process.env.NODE_ENV === "test";

const configureMiddleware = (func: () => void) => {
  if (INSIDE_TEST) return () => {};
  return func;
};

const LONG_LIVED_COMMANDS = ["site webhooks history"];

yargs(hideBin(process.argv))
  .scriptName("pcc")
  .usage("$0 <cmd>")
  .middleware(configureMiddleware(checkUpdate))
  .middleware(configureMiddleware(checkEnvironment))
  .strictCommands()
  .demandCommand()
  .version(false)
  .command(
    "version",
    "Prints the version of this CLI",
    () => void 0,
    () => console.log(getPackageDetails().version),
  )
  .command(
    "init <project_directory> [options]",
    "Sets up project with required files.",
    (yargs) => {
      yargs
        .positional("<project_directory>", {
          describe: "The project directory in which setup should be done.",
          demandOption: true,
          type: "string",
        })
        .option("template", {
          describe: "Template from which files should be copied.",
          type: "string",
          choices: ["nextjs"],
          default: "nextjs",
          demandOption: true,
        })
        .option("appName", {
          describe: '"package.json" compatible name for the project.',
          type: "string",
          demandOption: false,
        })
        .option("noInstall", {
          describe: "Do not install any dependencies.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("use-npm", {
          describe: "Use NPM package manager for installing dependencies.",
          type: "boolean",
          default: true,
          demandOption: false,
        })
        .option("use-pnpm", {
          describe: "Use PNPM package manager for installing dependencies.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("use-yarn", {
          describe: "Use Yarn package manager for installing dependencies.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("silent", {
          describe:
            "Skips all console output except for errors and return value from actions.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("non-interactive", {
          describe: "Skips asking any questions to the user.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("site-id", {
          describe: "Id of site to pre-populate .env file with.",
          type: "string",
          default: false,
          demandOption: false,
        })
        .option("eslint", {
          describe: "Initialize with eslint config.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("ts", {
          describe: "Initialize as a Typescript project.",
          type: "boolean",
          default: false,
          demandOption: false,
        })
        .option("verbose", {
          describe: "Print verbose logs.",
          type: "boolean",
          default: true,
          demandOption: false,
        })
        .option("git-ref", {
          describe:
            "Git ref (commit, tag, or branch) to use for the template. Defaults to latest tag.",
          type: "string",
          demandOption: false,
        })
        .option("appRouter", {
          describe: "Use App Router for the project.",
          type: "boolean",
          demandOption: false,
          default: false,
        })
        .example(formatExamples(INIT_EXAMPLES));
    },
    async (args) => {
      const dirName = args.project_directory as string;
      const template = args.template as CliTemplateOptions;
      const noInstall = args.noInstall as boolean;
      const useYarn = args.useYarn as boolean;
      const usePnpm = args.usePnpm as boolean;
      const appName = args.appName as string | undefined;
      const silent = args.silent as boolean;
      const nonInteractive = args.nonInteractive as boolean;
      const siteId = args.siteId as string;
      const eslint = args.eslint as boolean;
      const useAppRouter = args.appRouter as boolean;
      const useTypescript = args.ts as boolean;
      const printVerbose = args.verbose as boolean;
      const gitRef = args.gitRef as string | undefined;

      if (args.template === "vue" || args.template === "gatsby") {
        throw new Error(
          `The ${args.template} starter kit is no longer supported or maintained. You may manually reference the deprecated source code for it in our github repo (https://github.com/pantheon-systems/content-publisher-sdk/tree/main/starters).`,
        );
      }

      // Deriving package manager from CLI flags in [NPM, PNPM, Yarn] order
      let packageManager: PackageManager;
      if (useYarn) {
        if (!(await isProgramInstalled("yarn"))) {
          throw new Error(
            "You have run the init command with --use-yarn but we could not find yarn installed on this system. Please either install yarn (https://classic.yarnpkg.com/lang/en/docs/install) or run init again without the --use-yarn flag.",
          );
        }

        packageManager = "yarn";
      } else if (usePnpm) {
        if (!(await isProgramInstalled("pnpm"))) {
          throw new Error(
            "You have run the init command with --use-pnpm but we could not find pnpm installed on this system. Please either install pnpm (https://pnpm.io/installation) or run init again without the --use-pnpm flag.",
          );
        }

        packageManager = "pnpm";
      } else {
        packageManager = "npm";
      }

      await init({
        dirName,
        template,
        skipInstallation: noInstall,
        packageManager,
        appName,
        nonInteractive,
        siteId,
        silentLogs: silent,
        eslint,
        useAppRouter,
        useTypescript,
        printVerbose,
        gitRef,
      });
    },
  )
  .command(
    "account <cmd> [options]",
    "Manage accounts for a logged in user.",
    (yargs) => {
      yargs
        .strictCommands()
        .demandCommand()
        .command(
          "connect",
          "Connect a new account.",
          async () => await connectAccount(),
        )
        .command(
          "list",
          "Lists connected accounts.",
          () => {
            // noop
          },
          async () => await listAccounts(),
        )
        .example(formatExamples(ACCOUNT_EXAMPLES));
    },
    async () => {
      // noop
    },
  )
  .command(
    "token <cmd> [options]",
    "Manage tokens for the Content Publisher.",
    (yargs) => {
      yargs
        .strictCommands()
        .demandCommand()
        .command(
          "create",
          "Creates new token.",
          (yargs) => {
            yargs.option("siteId", {
              describe:
                "Site for which you want to create token. The token will only be able to access documents in this site",
              type: "string",
            });
          },
          async (args) => await createToken(args as { siteId?: string }),
        )
        .command(
          "list",
          "Lists existing tokens.",
          () => {
            // noop
          },
          async () => await listTokens(),
        )
        .command(
          "revoke <id>",
          "Revokes token for a given id.",
          (yargs) => {
            yargs.positional("<id>", {
              describe: "ID of the token which you want to revoke.",
              demandOption: true,
              type: "string",
            });
          },
          async (args) => await revokeToken(args.id as string),
        )
        .example(formatExamples(TOKEN_EXAMPLES));
    },
    async () => {
      // noop
    },
  )
  .command(
    "config <cmd> [options]",
    false,
    (yargs) => {
      yargs
        .strictCommands()
        .demandCommand()
        .command(
          "info",
          "Print configuration info.",
          () => {
            // noop
          },
          async () => await printConfigurationData(),
        )
        .command(
          "reset",
          "Reset configuration to defaults.",
          () => {
            // noop
          },
          async () => await resetTargetEnvironment(),
        )
        .command(
          "update <target>",
          "Set the target environment.",
          (yargs) => {
            yargs.positional("<target>", {
              describe: "Target environment.",
              demandOption: true,
              choices: ["production", "staging"],
              type: "string",
            });
          },
          async (args) =>
            await setTargetEnvironment(args.target as "production" | "staging"),
        );
    },
    async () => {
      // noop
    },
  )
  .command(
    "site <cmd> [options]",
    "Manage collections for the Content Publisher.",
    (yargs) => {
      yargs
        .strictCommands()
        .demandCommand()
        .command("admins [options]", "CRUD admins for a site", (yargs) => {
          yargs
            .strictCommands()
            .demandCommand()
            .command(
              "list [options]",
              "List admins for a site",
              (yargs) => {
                yargs.option("siteId", {
                  describe: "Site id",
                  type: "string",
                  demandOption: true,
                });
              },
              async (args) =>
                await listAdminsSchema({
                  siteId: args.siteId as string,
                }),
            )
            .command(
              "remove [options]",
              "Remove admin for a site",
              (yargs) => {
                yargs.option("siteId", {
                  describe: "Site id",
                  type: "string",
                  demandOption: true,
                });

                yargs.option("email", {
                  describe: "Email of admin to remove",
                  type: "string",
                  demandOption: true,
                });
              },
              async (args) =>
                await removeAdminSchema({
                  siteId: args.siteId as string,
                  email: args.email as string,
                }),
            )
            .command(
              "add [options]",
              "Add admin to a site",
              (yargs) => {
                yargs.option("siteId", {
                  describe: "Site id",
                  type: "string",
                  demandOption: true,
                });

                yargs.option("email", {
                  describe: "Email of admin to add",
                  type: "string",
                  demandOption: true,
                });
              },
              async (args) =>
                await addAdminSchema({
                  siteId: args.siteId as string,
                  email: args.email as string,
                }),
            );
        })
        .command(
          "create [options]",
          "Creates new site.",
          (yargs) => {
            yargs.option("url", {
              describe: "Site url",
              type: "string",
              demandOption: true,
            });
            yargs.option("accountEmail", {
              describe: "Account email site should be created with",
              type: "string",
              demandOption: true,
            });
          },
          async (args) =>
            await createSite({
              url: args.url as string,
              accountEmail: args.accountEmail as string,
            }),
        )
        .command(
          "delete [options]",
          "Delete site.",
          (yargs) => {
            yargs.option("id", {
              describe: "Site id",
              type: "string",
              demandOption: true,
            });
            yargs.option("transferToSiteId", {
              describe:
                "Id of site to transfer connected documents to. Required if force is not used.",
              type: "string",
              demandOption: false,
            });
            yargs.option("force", {
              describe:
                "If true, delete even if documents are connected to it.",
              type: "string",
              demandOption: false,
            });
          },
          async (args) =>
            await deleteSite({
              id: args.id as string,
              transferToSiteId: args.transferToSiteId as string,
              force: args.force === "true",
            }),
        )
        .command(
          "componentschema [command] [options]",
          "Make changes & inspect the component schema for a site",
          (yargs) => {
            yargs
              .command(
                "push [options]",
                "Retrieve the schema from the provided target URL and use that for the Content Publisher collection's component schema.",
                (yargs) => {
                  yargs.option("siteId", {
                    describe: "Site id",
                    type: "string",
                    demandOption: true,
                  });

                  yargs.option("target", {
                    describe:
                      "API path such as https://localhost:3000/api/pantheoncloud",
                    type: "string",
                    demandOption: true,
                  });
                },
                async (args) =>
                  await pushComponentSchema({
                    siteId: args.siteId as string,
                    componentSchema: await getComponentSchema(
                      args.target as string,
                      "",
                      ora("Retrieving live schema").start(),
                    ),
                  }),
              )
              .command(
                "print [options]",
                "Print the schema that Content Publisher knows about.",
                (yargs) => {
                  yargs.option("siteId", {
                    describe: "Site id",
                    type: "string",
                    demandOption: true,
                  });
                },
                async (args) =>
                  await printStoredComponentSchema({
                    siteId: args.siteId as string,
                  }),
              )
              .command(
                "remove [options]",
                "Use this command to stop using the pushed schema and revert back to real-time schema requests from the Content Publisher.",
                (yargs) => {
                  yargs.option("siteId", {
                    describe: "Site id",
                    type: "string",
                    demandOption: true,
                  });
                },
                async (args) =>
                  await removeStoredComponentSchema({
                    siteId: args.siteId as string,
                  }),
              );
          },
        )
        .command(
          "components [options]",
          "Shows component schema of the site.",
          (yargs) => {
            yargs.option("url", {
              describe: "Site url.",
              type: "string",
              demandOption: true,
            });

            yargs.option("apiPath", {
              describe: "API path such as /api/pantheoncloud/component_schema.",
              type: "string",
              demandOption: false,
            });
          },
          async (args) =>
            await printLiveComponentSchema({
              url: args.url as string,
              apiPath: args.apiPath as string | null,
            }),
        )
        .command(
          "list [options]",
          "Lists existing sites.",
          (yargs) => {
            yargs.option("withStatus", {
              describe: "Include connection statuses of the sites.",
              type: "boolean",
              default: false,
              demandOption: false,
            });
          },
          async (args) =>
            await listSites({
              withStatus: args.withStatus as boolean,
            }),
        )
        .command(
          "configure <id> [options]",
          "Configure properties for a given site.",
          (yargs) => {
            yargs
              .strictCommands()
              .positional("<id>", {
                describe: "ID of the site which you want to configure.",
                demandOption: true,
                type: "string",
              })
              .check((args) => {
                const providedProperties = configurableSiteProperties.filter(
                  (property) => args[property.id],
                );

                if (providedProperties.length === 0) {
                  throw new Error(
                    "Please provide at least one property to configure.",
                  );
                }

                return true;
              });

            configurableSiteProperties.forEach((property) => {
              yargs.option(property.command.name, {
                describe: property.command.description,
                type: property.command.type,
              });
            });
          },
          async (args) =>
            await updateSiteConfig({
              id: args.id as string,
              ...(args as unknown as Record<
                (typeof configurableSiteProperties)[number]["id"],
                string
              >),
            }),
        )
        .command(
          "webhooks <cmd> [options]",
          "Manage webhooks for a given site.",
          (yargs) => {
            yargs
              .strictCommands()
              .demandCommand()
              .command(
                "history <id>",
                "View webhook event delivery logs for a given site.",
                (yargs) => {
                  yargs
                    .strictCommands()
                    .positional("<id>", {
                      describe:
                        "ID of the site for which you want to see logs.",
                      demandOption: true,
                      type: "string",
                    })
                    .option("limit", {
                      describe: "Number of logs to fetch at a time.",
                      type: "number",
                      default: 100,
                      demandOption: false,
                    });
                },
                async (args) =>
                  await showLogs({
                    id: args.id as string,
                    limit: args.limit as number,
                  }),
              )
              .command(
                "preferred-events <id>",
                "Set preferred webhook events for a given site. Your webhook will only receive notifications for events that you specify.",
                (yargs) => {
                  yargs.strictCommands().positional("<id>", {
                    describe: "ID of the site for which you want to configure.",
                    demandOption: true,
                    type: "string",
                  });
                },
                async (args) =>
                  configurePreferredWebhookEvents(String(args.id)),
              );
          },
        )
        .command(
          "publishing <cmd> [options]",
          "Manage publishing permissions.",
          (yargs) => {
            yargs
              .strictCommands()
              .demandCommand()
              .command(
                "config [options]",
                "Update the collection's visibility.",
                (yargs) => {
                  yargs
                    .strictCommands()
                    .option("siteId", {
                      describe: "The id of the collection to modify.",
                      demandOption: true,
                      type: "string",
                    })
                    .option("mode", {
                      describe:
                        "The visibility of this collection (either 'private' or 'workspace').",
                      demandOption: true,
                      type: "string",
                    });
                },
                async (args) =>
                  await updateSiteConfig({
                    id: args.siteId as string,
                    visibility: args.mode as string,
                  }),
              )
              .command(
                "list-user [options]",
                "Print the users added as collaborators to this collection.",
                (yargs) => {
                  yargs.strictCommands().option("siteId", {
                    describe: "The id of the collection to modify.",
                    demandOption: true,
                    type: "string",
                  });
                },
                async (args) =>
                  await listCollaborators({
                    siteId: args.siteId as string,
                  }),
              )
              .command(
                "add-user [options]",
                "Update the collection's visibility.",
                (yargs) => {
                  yargs
                    .strictCommands()
                    .option("siteId", {
                      describe: "The id of the collection to modify.",
                      demandOption: true,
                      type: "string",
                    })
                    .option("user", {
                      describe: "The email of the user to add.",
                      demandOption: true,
                      type: "string",
                    });
                },
                async (args) =>
                  await addCollaborator({
                    siteId: args.siteId as string,
                    email: args.user as string,
                  }),
              )
              .command(
                "remove-user [options]",
                "Update the collection's visibility.",
                (yargs) => {
                  yargs
                    .strictCommands()
                    .option("siteId", {
                      describe: "The id of the collection to modify.",
                      demandOption: true,
                      type: "string",
                    })
                    .option("user", {
                      describe: "The email of the user to remove.",
                      demandOption: true,
                      type: "string",
                    });
                },
                async (args) =>
                  await removeCollaborator({
                    siteId: args.siteId as string,
                    email: args.user as string,
                  }),
              );
          },
        )
        .example(formatExamples(SITE_EXAMPLES));
    },
    async () => {
      // noop
    },
  )
  .command(
    "document <cmd> [options]",
    "Manage documents for the Content Publisher.",
    (yargs) => {
      yargs
        .strictCommands()
        .demandCommand()
        .command(
          "preview <id>",
          "Generates preview link for a given document ID.",
          (yargs) => {
            yargs
              .strictCommands()
              .positional("<id>", {
                describe: "ID or URL of the document.",
                demandOption: true,
                type: "string",
              })
              .option("baseUrl", {
                describe: "Base URL for the generated preview link.",
                type: "string",
                demandOption: false,
              });
          },
          async (args) =>
            await generatePreviewLink({
              documentId: args.id as string,
              baseUrl: args.baseUrl as string,
            }),
        )
        .example(formatExamples(DOCUMENT_EXAMPLES));
    },
  )
  .command(
    "import",
    "Imports posts from a Drupal JSON API endpoint into PCC",
    (yargs) => {
      yargs
        .strictCommands()
        .demandCommand()
        .command(
          "drupal <baseUrl> <siteId>",
          "Imports all articles from a Drupal JSON API endpoint into a new Google Drive folder and connects them to a target PCC collection",
          (yargs) => {
            yargs
              .strictCommands()
              .positional("baseUrl", {
                describe:
                  'URL of drupal json API endpoint such as "https://example.com/jsonapi/node/blog"',
                type: "string",
              })
              .positional("siteId", {
                describe: "Id of site to import articles into.",
                type: "string",
              })
              .option("verbose", {
                describe: "Print verbose logs.",
                type: "boolean",
                default: false,
                demandOption: false,
              })
              .option("publish", {
                describe: "Whether newly created article should be published",
                type: "boolean",
                default: false,
                demandOption: false,
              })
              .demandOption(["baseUrl", "siteId"]);
          },
          async (args) =>
            await importFromDrupal({
              baseUrl: args.baseUrl as string,
              siteId: args.siteId as string,
              verbose: args.verbose as boolean,
              publish: args.publish as boolean,
            }),
        )
        .command(
          "wordpress <baseUrl> <siteId>",
          "Imports all articles from a WordPress site into a new Google Drive folder and connects them to a target PCC collection",
          (yargs) => {
            yargs
              .strictCommands()
              .positional("baseUrl", {
                describe:
                  'URL of a WordPress site which has the JSON API enabled, such as "https://example.com"',
                type: "string",
              })
              .positional("siteId", {
                describe: "Id of site to import articles into.",
                type: "string",
              })
              .option("verbose", {
                describe: "Print verbose logs.",
                type: "boolean",
                default: false,
                demandOption: false,
              })
              .option("publish", {
                describe: "Whether newly created article should be published",
                type: "boolean",
                default: false,
                demandOption: false,
              })
              .demandOption(["baseUrl", "siteId"]);
          },
          async (args) =>
            await importFromWordPress({
              baseUrl: args.baseUrl as string,
              siteId: args.siteId as string,
              verbose: args.verbose as boolean,
              publish: args.publish as boolean,
            }),
        )
        .command(
          "markdown <filePath> <siteId>",
          "Import given markdown file into a new Google Drive folder and connects them to a target Content Publisher collection",
          (yargs) => {
            yargs
              .strictCommands()
              .positional("filePath", {
                describe:
                  "Absolute or relative path of the local markdown file.",
                type: "string",
              })
              .positional("siteId", {
                describe: "Id of site to import articles into.",
                type: "string",
              })
              .option("publish", {
                describe: "Whether newly created article should be published",
                type: "boolean",
                default: false,
                demandOption: false,
              })
              .option("verbose", {
                describe: "Print verbose logs.",
                type: "boolean",
                default: false,
                demandOption: false,
              })
              .demandOption(["filePath", "siteId"]);
          },
          async (args) =>
            await importFromMarkdown({
              filePath: args.filePath as string,
              siteId: args.siteId as string,
              verbose: args.verbose as boolean,
              publish: args.publish as boolean,
            }),
        );
    },
    async () => {
      // noop
    },
  )
  .command(
    "whoami",
    "Print information about yourself.",
    () => {
      // noop
    },
    async () => await printWhoAmI(),
  )
  .command(
    "login",
    "Logs you in you to the Content Publisher client.",
    () => {
      // noop
    },
    async () => await login(),
  )
  .command(
    "logout",
    "Logs you out you from the Content Publisher client.",
    () => {
      // noop
    },
    async () => await logout(),
  )
  .example(
    formatExamples([
      ...LOGIN_EXAMPLES,
      ...INIT_EXAMPLES,
      ...TOKEN_EXAMPLES,
      ...SITE_EXAMPLES,
      ...DOCUMENT_EXAMPLES,
      ...WHOAMI_EXAMPLES,
      ...LOGOUT_EXAMPLES,
    ]),
  )
  .help(true)
  .wrap(null)
  .parseAsync()
  .then((res) => {
    const command = res._.join(" ");
    if (LONG_LIVED_COMMANDS.includes(command)) return;

    process.exit();
  });
