import { sh } from "../lib/utils";

jest.setTimeout(180000);

const PCC = "./dist/index.js";

const executePCC = async (command: string, args: string[]) => {
  try {
    return await sh("node", [PCC, command, ...args], true);
  } catch (e) {
    console.error("executePCC encountered an issue", e, "args used:", [
      PCC,
      command,
      ...args,
    ]);
    throw e;
  }
};

test("should include appRouter flag in help", async () => {
  const { stdout, stderr } = await executePCC("init", ["help"]);

  expect(stderr).toBe("");
  expect(stdout).toContain("--appRouter");
  expect(stdout).toContain(
    "Use App Router for the project.  [boolean] [default: false]",
  );
});
