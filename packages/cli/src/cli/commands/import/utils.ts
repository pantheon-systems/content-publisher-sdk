import { exit } from "process";
import chalk from "chalk";
import type { GaxiosResponse } from "gaxios";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import AddOnApiHelper from "../../../lib/addonApiHelper";
import { GoogleAuthProvider, PersistedTokens } from "../../../lib/auth";
import { Logger } from "../../../lib/logger";

export function preprocessBaseURL(originalBaseURL: string) {
  let baseURL: string | null = originalBaseURL;

  if (originalBaseURL == null) {
    return null;
  }

  try {
    new URL(originalBaseURL);

    // If protocol is not provided, add it for convenience
    if (originalBaseURL.startsWith("localhost:")) {
      baseURL = `http://${originalBaseURL}`;

      // Validate again
      new URL(originalBaseURL);
    }

    return baseURL;
  } catch (_err) {
    console.error(_err);
    return null;
  }
}

export function getAuthedDrive(tokens: PersistedTokens) {
  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.drive({
    version: "v3",
    auth: oauth2Client,
  });
}

export async function createFolder(drive: drive_v3.Drive, folderName: string) {
  const folderRes = (await drive.files
    .create({
      fields: "id,name",
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
    })
    .catch(console.error)) as GaxiosResponse<drive_v3.Schema$File>;

  return folderRes.data;
}
