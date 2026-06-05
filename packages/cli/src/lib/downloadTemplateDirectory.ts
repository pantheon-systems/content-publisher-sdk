import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Octokit } from "octokit";

const octokit = new Octokit();

const owner = "pantheon-systems";
const repo = "content-publisher-sdk";

interface File {
  path: string;
  contents: Buffer;
}

interface GitHubTreeNode {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

export async function downloadTemplateDirectory(
  directory: string,
  outputDirectory: string,
  printVerbose?: boolean,
  gitRef?: string,
) {
  try {
    // Fetch files but ignore certain ones.
    const files = (await fetchFiles(directory, printVerbose, gitRef)).filter(
      (file: File) => !["turbo.json"].includes(file.path),
    );

    await Promise.all(files.map((file: File) => output(file, outputDirectory)));

    return path.resolve(outputDirectory);
  } catch (error) {
    throw new Error("Error fetching starter kit from Github: " + error);
  }
}

async function output(file: File, outputDirectory: string) {
  const outputPath = path.join(outputDirectory, file.path);
  const dir = path.dirname(outputPath);

  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, file.contents);
}

async function fetchFiles(
  directory: string,
  printVerbose?: boolean,
  ref?: string,
) {
  // Use the provided ref (commit, tag, or branch), default to stable if not set
  const treeSha = ref || "stable";
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner,
      repo,
      tree_sha: treeSha,
      recursive: "true",
    },
  );

  const files = data.tree
    .filter((node: GitHubTreeNode): node is GitHubTreeNode & { path: string } =>
      Boolean(node.path?.startsWith(directory) && node.type === "blob"),
    )
    .map((node: GitHubTreeNode & { path: string }) => node.path);

  const downloadPromises = files.map(async (filePath: string) => {
    if (printVerbose) {
      console.log(`Downloading ${filePath}`);
    }

    // Use the ref for the raw file download
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${treeSha}/${filePath}`;

    async function attemptDownload(url: string, retryAllowed: boolean) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.arrayBuffer();

        return {
          path: filePath.replace(directory, ""),
          contents: Buffer.from(data),
        };
      } catch (e) {
        // Check for network errors (TypeError from fetch)
        if (e instanceof TypeError && retryAllowed) {
          console.error(
            `Failed to download ${url}, but reattempting one time.`,
          );
          return attemptDownload(url, false);
        }

        console.error(`Failed to download ${url}`);
        throw e;
      }
    }

    return attemptDownload(url, true);
  });

  return Promise.all(downloadPromises);
}
