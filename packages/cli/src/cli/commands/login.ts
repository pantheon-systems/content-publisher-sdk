import { Auth0Provider } from "../../lib/auth";
import { errorHandler } from "../exceptions";

async function login(): Promise<void> {
  const provider = new Auth0Provider();
  await provider.login();
}
export default errorHandler<void>(login);
export const LOGIN_EXAMPLES = [
  { description: "Login the user", command: "$0 login" },
];
