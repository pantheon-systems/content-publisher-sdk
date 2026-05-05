import { exit } from "process";
import ora from "ora";
import { getApiConfig } from "../../lib/apiConfig";
import * as LocalStorage from "../../lib/localStorage";
import { errorHandler } from "../exceptions";

export const setTargetEnvironment = errorHandler<string>(
  async (target: string) => {
    return new Promise<void>(
      // eslint-disable-next-line no-async-promise-executor -- Handling promise rejection in the executor
      async (resolve, reject) => {
        const spinner = ora("Updating config file").start();

        // Validate target value
        if (!["production", "staging"].includes(target)) {
          spinner.fail(
            "The provided value should either be 'production' or `staging'",
          );
          exit(1);
        }

        try {
          await LocalStorage.persistConfigDetails({
            targetEnvironment: target as "production" | "staging",
          });

          spinner.succeed(`Successfully updated config file`);
          resolve();
        } catch (e) {
          spinner.fail();
          reject(e);
        }
      },
    );
  },
);

export const resetTargetEnvironment = errorHandler<void>((): Promise<void> => {
  return new Promise(
    // eslint-disable-next-line no-async-promise-executor -- Handling promise rejection in the executor
    async (resolve, reject) => {
      const spinner = ora("Deleting config file").start();
      try {
        await LocalStorage.deleteConfigDetails();
        spinner.succeed(`Successfully deleted config file`);
        resolve();
      } catch (e) {
        spinner.fail();
        reject(e);
      }
    },
  );
});

export const printConfigurationData = errorHandler<void>(
  async (): Promise<void> => {
    return new Promise(
      // eslint-disable-next-line no-async-promise-executor -- Handling promise rejection in the executor
      async (resolve, reject) => {
        const spinner = ora("Retrieving configuration data").start();
        try {
          const localConfig = await LocalStorage.getConfigDetails();
          const apiConfig = await getApiConfig();
          console.log(JSON.stringify({ localConfig, apiConfig }, null, 4));
          spinner.succeed(`Successfully retrieved configuration data`);
          resolve();
        } catch (e) {
          spinner.fail();
          reject(e);
        }
      },
    );
  },
);
