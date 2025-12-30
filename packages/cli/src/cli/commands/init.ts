import {
  copyFileSync,
  existsSync,
  openSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import path from "path";
import { exit } from "process";
import chalk from "chalk";
import inquirer from "inquirer";
import AddOnApiHelper from "../../lib/addonApiHelper";
import { downloadTemplateDirectory } from "../../lib/downloadTemplateDirectory";
import { Logger, SpinnerLogger } from "../../lib/logger";
import { replaceEnvVariable, sh } from "../../lib/utils";
import { errorHandler } from "../exceptions";

const TEMPLATE_FOLDER_MAP = {
  nextjs: "nextjs-starter",
};

const ESLINT_DEPENDENCIES = {
  eslint: "*",
  "eslint-config-next": "*",
};

const ESLINT_CONFIG = {
  extends: "next/core-web-vitals",
};

/**
 * Handles initializing projects for Content Publisher
 */
const init = async ({
  dirName,
  template,
  skipInstallation,
  packageManager = "npm",
  nonInteractive = false,
  siteId = null,
  silentLogs,
  eslint,
  appName,
  useAppRouter,
  useTypescript,
  printVerbose,
  gitRef,
}: {
  dirName: string;
  template: CliTemplateOptions;
  skipInstallation: boolean;
  packageManager: PackageManager;
  nonInteractive: boolean;
  siteId?: string | null | undefined;
  silentLogs: boolean;
  eslint: boolean;
  appName?: string;
  useAppRouter?: boolean;
  useTypescript: boolean;
  printVerbose?: boolean;
  gitRef?: string;
}) => {
  const logger = new Logger(silentLogs);
  if (!dirName) {
    logger.error(
      chalk.red(
        "ERROR: Please enter valid directory name. Check pcc init --help for more details.",
      ),
    );
    exit(1);
  }

  if (existsSync(dirName)) {
    logger.error(chalk.red("ERROR: Project directory already exists."));
    exit(1);
  }

  // Cloning starter kit locally
  const fetchStarter = new SpinnerLogger("Fetching starter kit...", silentLogs);
  fetchStarter.start();

  if (template === "nextjs" && useAppRouter && !useTypescript) {
    logger.error(
      chalk.red("ERROR: Typescript is required when using nextjs app router"),
    );
    exit(1);
  }

  const starterPath = `starters/${TEMPLATE_FOLDER_MAP[template]}${
    useAppRouter ? "-approuter" : ""
  }${useTypescript ? "-ts" : ""}/`;

  const absoluteProjectPath = await downloadTemplateDirectory(
    starterPath,
    dirName,
    printVerbose,
    gitRef,
  );

  fetchStarter.succeed("Fetched starter kit!");

  // Setting up new project
  const setupProj = new SpinnerLogger("Setting up project...", silentLogs);
  setupProj.start();

  const packageJson = JSON.parse(
    readFileSync(path.join(absoluteProjectPath, "package.json")).toString(),
  );

  if (appName) packageJson.name = appName;
  else packageJson.name = path.parse(dirName).base;

  const eslintFilePath = path.join(absoluteProjectPath, ".eslintrc.json");
  if (eslint && template === "nextjs") {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...ESLINT_DEPENDENCIES,
    };

    let esLintFd = null;
    try {
      esLintFd = openSync(eslintFilePath, "wx");
    } catch {
      // Ignore when eslint file already exists
    }
    if (esLintFd)
      writeFileSync(esLintFd, JSON.stringify(ESLINT_CONFIG, null, 2));
  } else if (!eslint) {
    // Remove eslint file and don't raise exception if it doesn't exist
    rmSync(eslintFilePath, { force: true });
  }

  writeFileSync(
    path.join(absoluteProjectPath, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
  );

  setupProj.succeed("Completed setting up project!");

  // Create .env.local
  const localEnvFileName = ".env.local";

  copyFileSync(
    path.join(absoluteProjectPath, ".env.example"),
    path.join(absoluteProjectPath, localEnvFileName),
  );

  if (!skipInstallation) {
    // Installing dependencies
    new SpinnerLogger("Installing dependencies...", silentLogs).info();
    try {
      await sh(packageManager, ["install"], !silentLogs, absoluteProjectPath);
    } catch (e) {
      console.error(e);
      throw e;
    }

    new SpinnerLogger("", silentLogs).succeed("Installed dependencies!");
  }

  let apiKey;

  if (!nonInteractive) {
    if (!siteId) {
      const { chooseSite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "chooseSite",
          message: "Pick site now?",
        },
      ]);

      if (chooseSite) {
        const sites = await AddOnApiHelper.listSites({});
        if (sites.length > 0) {
          siteId = (
            await inquirer.prompt({
              type: "list",
              name: "siteId",
              choices: sites
                .filter((x) => !x.__isPlayground)
                .map((x) => `${x.url} (${x.id})`),
            })
          ).siteId
            .split(" (")[1]
            .replace(")", "");
        } else {
          new SpinnerLogger("", silentLogs).fail("No sites found.");
        }
      }
    }

    const { createNewApiKey } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createNewApiKey",
        message: "Create a new Token?",
      },
    ]);

    if (createNewApiKey) {
      apiKey = await AddOnApiHelper.createApiKey();
    }
  }

  if (apiKey != null || siteId != null) {
    let envFile = readFileSync(
      path.join(absoluteProjectPath, localEnvFileName),
    ).toString();

    if (siteId != null) {
      envFile = replaceEnvVariable(envFile, "PCC_SITE_ID", siteId);
    }

    if (apiKey != null) {
      envFile = replaceEnvVariable(envFile, "PCC_TOKEN", apiKey);
    }

    writeFileSync(path.join(absoluteProjectPath, localEnvFileName), envFile);
  }

  if (apiKey == null || siteId == null) {
    // Messaging to get started
    logger.log();
    logger.log(
      chalk.green(
        `To get started please replace the placeholders in ${localEnvFileName}`,
      ),
    );
    logger.log(chalk.green(`   cd ${dirName}`));

    const textEditor = process.platform === "win32" ? "notepad" : "vim";

    logger.log(chalk.green(`   ${textEditor} ${localEnvFileName}`));
    logger.log(chalk.green("And then run the website"));
  } else {
    logger.log(
      chalk.green(
        `You have successfully populated the local environment file. You can edit this at any time by opening ${localEnvFileName}`,
      ),
    );
    logger.log(
      chalk.green(
        "You are now ready to run the website locally, which you can do by executing in the command line:",
      ),
    );

    logger.log(chalk.green(`   cd ${dirName}`));
  }

  if (template === "nextjs")
    logger.log(chalk.green(`   ${packageManager} run dev`));
  else logger.log(chalk.green(`   ${packageManager} run start`));
};

export default errorHandler<{
  dirName: string;
  template: CliTemplateOptions;
  packageManager: PackageManager;
  skipInstallation: boolean;
  nonInteractive: boolean;
  siteId?: string | null | undefined;
  silentLogs: boolean;
  eslint: boolean;
  appName?: string;
  useAppRouter?: boolean;
  useTypescript: boolean;
  printVerbose?: boolean;
  gitRef?: string;
}>(init, (args) => {
  // Cleanup template directory if it exists
  const { dirName } = args;

  if (existsSync(dirName)) {
    rmdirSync(dirName, { recursive: true });
  }
});

export const INIT_EXAMPLES = [
  {
    description: "Create project with nextjs template",
    command: "pcc init new_proj",
  },
  {
    description: "Create project using pnpm package manager",
    command: "pcc init new_proj --use-pnpm",
  },
  {
    description: "Create Typescript project and setup ESLint in it",
    command: "pcc init new_proj --ts --eslint",
  },
  {
    description: "Create project without installing dependencies",
    command: "pcc init new_proj --noInstall",
  },
  {
    description:
      "Create project and provide site ID to pre-populate .env file with",
    command: "pcc init new_proj --site-id 123456789example1234",
  },
];
