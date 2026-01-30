import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { ensureFile, remove } from "fs-extra";
import { PCC_ROOT_DIR } from "../constants";
import { Config } from "../types/config";
import { PersistedTokens } from "./auth";

const AUTH_FILE_PATH = path.join(PCC_ROOT_DIR, "auth.json");
const GOOGLE_AUTH_FILE_PATH = path.join(PCC_ROOT_DIR, "google.json");
const CONFIG_FILE_PATH = path.join(PCC_ROOT_DIR, "config.json");

const persistDetailsToFile = async (payload: unknown, filePath: string) => {
  await new Promise<void>((resolve, reject) =>
    ensureFile(filePath, (err: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }),
  );

  writeFileSync(filePath, JSON.stringify(payload, null, 2));
};
const readFile = async <T>(path: string): Promise<T | null> => {
  try {
    return JSON.parse(readFileSync(path).toString()) as T;
  } catch {
    return null;
  }
};

export const getConfigDetails = async (): Promise<Config | null> => {
  return readFile<Config>(CONFIG_FILE_PATH);
};
export const getAuthDetails = async (): Promise<PersistedTokens | null> => {
  return readFile<PersistedTokens>(AUTH_FILE_PATH);
};
export const getGoogleAuthDetails = async (
  email: string,
): Promise<PersistedTokens | null> => {
  const authDetails =
    (await readFile<{ [key: string]: PersistedTokens }>(
      GOOGLE_AUTH_FILE_PATH,
    )) || {};
  return authDetails[email] || null;
};

export const persistConfigDetails = async (payload: Config): Promise<void> => {
  await persistDetailsToFile(payload, CONFIG_FILE_PATH);
};
export const persistAuthDetails = async (
  payload: PersistedTokens,
): Promise<void> => {
  await persistDetailsToFile(payload, AUTH_FILE_PATH);
};
export const persistGoogleAuthDetails = async (
  email: string,
  credentials: PersistedTokens,
): Promise<void> => {
  const authDetails =
    (await readFile<{ [key: string]: PersistedTokens }>(
      GOOGLE_AUTH_FILE_PATH,
    )) || {};
  authDetails[email] = credentials;
  await persistDetailsToFile(authDetails, GOOGLE_AUTH_FILE_PATH);
};

export const deleteConfigDetails = async () => remove(CONFIG_FILE_PATH);
export const deleteAuthDetails = async () => remove(AUTH_FILE_PATH);
export const deleteGoogleAuthDetails = async () =>
  remove(GOOGLE_AUTH_FILE_PATH);
