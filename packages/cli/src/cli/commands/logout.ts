import ora from "ora";
import {
  deleteAuthDetails,
  deleteGoogleAuthDetails,
} from "../../lib/localStorage";
import { errorHandler } from "../exceptions";

const logout = async () => {
  const spinner = ora("Logging you out...").start();
  try {
    await deleteAuthDetails();
    await deleteGoogleAuthDetails();
    spinner.succeed(
      "Successfully logged you out from the Content Publisher client!",
    );
  } catch (e) {
    spinner.fail();
    throw e;
  }
};

export default errorHandler<void>(logout);

export const LOGOUT_EXAMPLES = [
  { description: "Logout the user", command: "$0 logout" },
];
