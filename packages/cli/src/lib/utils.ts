import { spawn } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterUndefinedProperties(obj: Record<string, any>) {
  const _obj = obj;
  Object.keys(_obj).forEach((key) =>
    _obj[key] === undefined ? delete _obj[key] : {},
  );
  return _obj;
}

export function parameterize(
  obj: { [s: string]: string } | ArrayLike<string>,
  encode = true,
): string {
  const func = encode ? encodeURIComponent : (s: string): string => s;
  return Object.entries<string>(obj)
    .map(([k, v]) => `${func(k)}=${func(v)}`)
    .join("&");
}

export function replaceEnvVariable(
  envFile: string,
  key: string,
  value: string,
) {
  const envFileLines = envFile.split("\n");
  const index = envFileLines.findIndex((x) => x.indexOf(key) === 0);
  const parts = envFileLines[index].split("=");
  parts[1] = value;
  envFileLines[index] = parts.join("=");
  return envFileLines.join("\n");
}

export function sh(
  cmd: string,
  args: string[],
  displayOutput = false,
  cwd?: string,
) {
  return new Promise<{ stdout: string; stderr: string; code: number }>(
    function (resolve, reject) {
      let stdout = "";
      let stderr = "";

      const pr = spawn(cmd, args, {
        stdio: displayOutput ? "pipe" : undefined,
        shell: true,
        ...(cwd && { cwd }),
      });

      pr.stdout?.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        if (displayOutput) {
          console.log(text);
        }
      });

      pr.stderr?.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        if (displayOutput) {
          console.error(text);
        }
      });

      pr.on("exit", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          console.error({ stdout, stderr });
          reject(
            displayOutput
              ? stderr || `Exited with code: ${code}`
              : `Exited with code: ${code}`,
          );
        }
      });
    },
  );
}

export function toKebabCase(s: string) {
  return s
    .trim()
    .replace(/[^\w\s]/gi, "-")
    .replace(/[\s_]+|[^\w\s]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-{2,}/g, "-") // Replace repeating hyphens with a single hyphen
    .toLowerCase();
}

export async function isProgramInstalled(programNamed: string) {
  try {
    await sh(`${programNamed} -v`, []);
    return true;
  } catch {
    return false;
  }
}
