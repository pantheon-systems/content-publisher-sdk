import { exit } from "process";
import chalk from "chalk";

export class UnhandledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotLoggedIn extends Error {
  constructor() {
    super("Please login user using `pcc login` command");
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
        console.log(chalk.red("Error: User is not logged in."));
        console.log(chalk.yellow('Please run "pcc login" to login.'));
      } else {
        console.log(
          chalk.yellow("\nStack trace:", (e as { stack: string }).stack),
        );
        console.log(
          chalk.red(
            "Error: Something went wrong. Please contact Pantheon support team.",
          ),
        );
        exit(1);
      }
    }
  };
}
