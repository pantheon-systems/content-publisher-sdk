import { exit } from "process";
import chalk from "chalk";

// Helper to check if error is from a fetch HTTP response
interface FetchErrorResponse {
  status?: number;
  data?: unknown;
}

function isFetchError(error: unknown): error is FetchErrorResponse {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as FetchErrorResponse).status === "number"
  );
}

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
          isFetchError(e) &&
          (e.status ?? 500) < 500 && // Treat internal server errors as unhandled errors
          e.data
        ) {
          // Operational error (4xx client errors)
          console.log(chalk.red(`\nError: ${e.data.message || e.data}`));
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
