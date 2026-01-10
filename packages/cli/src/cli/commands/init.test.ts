import fs, { readFileSync } from "fs";
import path from "path";
import tmp from "tmp";
import { sh } from "../../lib/utils";

jest.setTimeout(180000);

const PCC = "./dist/index.js";

const defaultArgs = ["--non-interactive", "--noInstall", "--verbose"];

const executePCC = async (command: string, args: string[]) => {
  try {
    return await sh("node", [PCC, command, ...args, ...defaultArgs], true);
  } catch (e) {
    console.error("executePCC encountered an issue", e, "args used:", [
      PCC,
      command,
      ...args,
      ...defaultArgs,
    ]);
    throw e;
  }
};

test("should be able to init starter kit for nextjs template", async () => {
  const appFolder = tmp.tmpNameSync();

  await executePCC("init", [appFolder, "--template", "nextjs", "--use-pnpm"]);

  // Eslint should not be initialized
  expect(fs.existsSync(`${appFolder}/.eslintrc.json`)).toBe(false);

  // Checking if primary required files for Nextjs starter kit are created.
  expect(fs.existsSync(`${appFolder}/next.config.js`)).toBe(true);
  expect(fs.existsSync(`${appFolder}/pages/index.jsx`)).toBe(true);

  // package.json checks
  expect(fs.existsSync(`${appFolder}/package.json`)).toBe(true);
  const packageJson = JSON.parse(
    readFileSync(`${appFolder}/package.json`).toString(),
  );
  expect(packageJson.name).toBe(path.parse(appFolder).base);

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});

test("should be able to init starter kit for nextjs template with typescript", async () => {
  const appFolder = tmp.tmpNameSync();

  await executePCC("init", [
    appFolder,
    "--template",
    "nextjs",
    "--use-pnpm",
    "--ts",
  ]);

  // Eslint should not be initialized
  expect(fs.existsSync(`${appFolder}/.eslintrc.json`)).toBe(false);

  // Checking if primary required files for Nextjs starter kit are created.
  expect(fs.existsSync(`${appFolder}/next.config.js`)).toBe(true);
  expect(fs.existsSync(`${appFolder}/pages/index.tsx`)).toBe(true);

  // package.json checks
  expect(fs.existsSync(`${appFolder}/package.json`)).toBe(true);
  const packageJson = JSON.parse(
    readFileSync(`${appFolder}/package.json`).toString(),
  );
  expect(packageJson.name).toBe(path.parse(appFolder).base);

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});

test("should be able to init starter kit with eslint and app name", async () => {
  const appFolder = tmp.tmpNameSync();

  await executePCC("init", [
    appFolder,
    "--appName",
    "test_app",
    "--template",
    "nextjs",
    "--eslint",
  ]);

  // Eslint is initialized
  expect(fs.existsSync(`${appFolder}/.eslintrc.json`)).toBe(true);

  // Package.json checks
  expect(fs.existsSync(`${appFolder}/package.json`)).toBe(true);
  const packageJson = JSON.parse(
    readFileSync(`${appFolder}/package.json`).toString(),
  );
  expect(packageJson.name).toBe("test_app");

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});

test("should raise error when project directory already exists", async () => {
  const appFolder = tmp.tmpNameSync();
  fs.mkdirSync(appFolder);

  let error = false;
  try {
    await executePCC("init", [appFolder, "--template", "nextjs", "--eslint"]);
  } catch (err) {
    error = true;
  }

  // No files are created
  expect(error).toBe(true);

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});

test("should raise error when template name is incorrect", async () => {
  const appFolder = tmp.tmpNameSync();

  let error = 0;
  try {
    await executePCC("init", [
      appFolder,
      "--appName",
      "test_app",
      "--template",
      "react",
      "--eslint",
    ]);
  } catch (err) {
    error = 1;
  }

  expect(error).toBe(1);

  // No files are created
  expect(fs.existsSync(appFolder)).toBe(false);

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});

test("should be able to init starter kit with default git ref (latest tag)", async () => {
  const appFolder = tmp.tmpNameSync();

  await executePCC("init", [appFolder, "--template", "nextjs"]);

  // Check for expected files
  expect(fs.existsSync(`${appFolder}/next.config.js`)).toBe(true);
  expect(fs.existsSync(`${appFolder}/package.json`)).toBe(true);

  // Check that the pcc-sdk-core version is NOT 3.0.3
  const packageJson = JSON.parse(
    readFileSync(`${appFolder}/package.json`).toString(),
  );
  const sdkVersion =
    packageJson.dependencies?.["@pantheon-systems/cpub-react-sdk"] ||
    packageJson.devDependencies?.["@pantheon-systems/cpub-react-sdk"];
  expect(sdkVersion).not.toBe("~4.0.0-beta.0");

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});

test("should be able to init starter kit with a specific git ref (4.0.0-beta)", async () => {
  const appFolder = tmp.tmpNameSync();

  await executePCC("init", [
    appFolder,
    "--template",
    "nextjs",
    "--git-ref",
    "4.0.0-beta",
  ]);

  // Check for expected files
  expect(fs.existsSync(`${appFolder}/next.config.js`)).toBe(true);
  expect(fs.existsSync(`${appFolder}/package.json`)).toBe(true);

  // Check that the pcc-sdk-core version is 4.0.0-beta.0
  const packageJson = JSON.parse(
    readFileSync(`${appFolder}/package.json`).toString(),
  );
  console.dir(packageJson, { depth: null });
  const sdkVersion =
    packageJson.dependencies?.["@pantheon-systems/cpub-react-sdk"] ||
    packageJson.devDependencies?.["@pantheon-systems/cpub-react-sdk"];
  expect(sdkVersion).toBe("~4.0.0-beta.0");

  // Remove app folder
  fs.rmSync(appFolder, { recursive: true, force: true });
});
