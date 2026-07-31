#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");

const { startMockServer } = require(
  path.join(__dirname, "pcc-mocks", "mock-fetch"),
);

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: with-mock-pcc-server.js <command> [args...]");
    process.exit(1);
  }

  if (!process.env.PCC_SITE_ID) process.env.PCC_SITE_ID = "mock-site-id";
  if (!process.env.PCC_TOKEN) process.env.PCC_TOKEN = "mock-token";

  const { server } = await startMockServer();

  const child = spawn(args[0], args.slice(1), {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  child.on("close", (code) => {
    server.close();
    process.exit(code ?? 1);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      server.close();
      child.kill(signal);
    });
  }
}

main();
