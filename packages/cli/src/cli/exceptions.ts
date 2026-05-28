import { exit } from "process";
import chalk from "chalk";
import { HttpError } from "../lib/addonApiHelper";

export class UnhandledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotLoggedIn extends Error {
  constructor() {
    super("Please login user using `cpub login` command");
    this.name = this.constructor.name;
  }
}

export class IncorrectAccount extends Error {
  constructor() {
    super("Selected account is not valid");
    this.name = this.constructor.name;
  }
}
export class HTTPNotFound extends Error {
  constructor() {
    super("Not Found");
    this.name = this.constructor.name;
  }
}
export function errorHandler<T>(
  f: (arg: T) => Promise<void>,
  cleanup?: (arg: T) => void,
) {
  return async function (arg: T) {
    try {
      await f(arg);
    } catch (e) {
      if (cleanup) cleanup(arg);

      if (e instanceof UserNotLoggedIn) {
        console.log(chalk.red("\nError: User is not logged in."));
        console.log(chalk.yellow('\nPlease run "cpub login" to login.'));
      } else {
        if (e instanceof HttpError && e.status < 500 && e.responseData) {
          // Operational error
          console.log(
            chalk.red(
              `\nError: ${(e.responseData as { message?: string }).message || e.responseData}`,
            ),
          );
        } else {
          // Unhandled error
          console.log(
            chalk.yellow("\nStack trace:", (e as { stack: string }).stack),
          );
          console.log(
            chalk.red(
              "\nError: Something went wrong. Please contact Pantheon support team.",
            ),
          );
        }

        exit(1);
      }
    }
  };
}
