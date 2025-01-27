import ora from "ora";
import {
  deleteAuthDetails,
  deleteGoogleAuthDetails,
} from "../../lib/localStorage";
import { errorHandler } from "../exceptions";

const logout = async () => {
  const spinner = ora("Logging you out...").start();
  try {
    deleteAuthDetails();
    deleteGoogleAuthDetails();
    spinner.succeed("Successfully logged you out from PPC client!");
  } catch (e) {
    spinner.fail();
    throw e;
  }
};

export default errorHandler<void>(logout);

export const LOGOUT_EXAMPLES = [
  { description: "Logout the user", command: "$0 logout" },
];
