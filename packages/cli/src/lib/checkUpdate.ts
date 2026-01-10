import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import boxen from "boxen";
import chalk from "chalk";
import pkgJson from "package-json";
import semver from "semver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getPackageDetails() {
  const { name, version } = JSON.parse(
    fs.readFileSync(__dirname + "/../package.json").toString(),
  );

  return { name, version };
}

// Max time limit for checkUpdate execution
const CHECK_UPDATE_TIMEOUT_MS = 1000;

const checkUpdate = async (): Promise<void> => {
  return new Promise((resolve) => {
    let isResolved = false;
    const timer = setTimeout(() => {
      isResolved = true;
      resolve();
    }, CHECK_UPDATE_TIMEOUT_MS);

    (async () => {
      const { name, version } = getPackageDetails();

      // Check if user is using the old package name
      if (name === "@pantheon-systems/pcc-cli") {
        const migrationMsg = `We see you're on version ${chalk.dim(name)}, we've renamed to ${chalk.green("@pantheon-systems/cpub-cli")}. Please remove this package, and install the new one.\n\nFor more information, read ${chalk.cyan("https://docs.content.pantheon.io/CLI-update")}`;

        console.log(
          boxen(migrationMsg, {
            margin: 1,
            padding: 1,
            align: "center",
          }),
        );
        clearTimeout(timer);
        resolve();
        return;
      }

      const { versions: allPublishedVersions } = await pkgJson(name, {
        allVersions: true,
      });
      if (isResolved) return;

      const versionKeys = Object.keys(allPublishedVersions);
      let latestVersion = versionKeys.pop();

      while (latestVersion != null) {
        if (
          !semver.prerelease(latestVersion) &&
          semver.gt(latestVersion, version)
        ) {
          break;
        }

        latestVersion = versionKeys.pop();
      }

      const updateAvailable =
        latestVersion != null && semver.lt(version, latestVersion as string);
      if (updateAvailable) {
        const msg = {
          updateAvailable: `Update available! ${chalk.dim(version)} → ${chalk.green(
            latestVersion,
          )}.`,
          runUpdate: `Run ${chalk.cyan(`npm i -g ${name}`)} to update.`,
        };

        console.log(
          boxen(`${msg.updateAvailable}\n${msg.runUpdate}`, {
            margin: 1,
            padding: 1,
            align: "center",
          }),
        );
      }
      clearTimeout(timer);
      resolve();
    })();
  });
};

export default checkUpdate;
