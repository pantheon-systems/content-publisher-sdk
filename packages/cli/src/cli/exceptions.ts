import { exit } from "process";
import axios from "axios";
import chalk from "chalk";

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
        if (
          axios.isAxiosError(e) &&
          (e.response?.status ?? 500) < 500 && // Treat internal server errors as unhandled errors
          e.response?.data
        ) {
          // Operational error
          console.log(
            chalk.red(`\nError: ${e.response.data.message || e.response.data}`),
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
