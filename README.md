# Pantheon Content Publisher SDKs

## Overview

This repository houses the Pantheon Content Publisher SDKs and starters.

These SDKs are used to interact with the Pantheon Content Publisher APIs.
Starters allow you to quickly get up and running with Pantheon Content
Publisher.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/en/) Version 18 LTS
- [PNPM](https://pnpm.io/) Version 8.6.11

### Setup the monorepo

1. Install dependencies in all packages

   ```sh
   pnpm install
   ```

2. Build all packages

   ```sh
    pnpm build
   ```

3. Start the development servers

   ```sh
   pnpm dev
   ```

### Running the CLI

1. Follow the "setup the monorepo" steps.

2. Run the CLI

   ```sh
   node packages/cli/dist/index.js
   ```

   It will respond with the possible commands. A full example command would be:

   ```sh
   node packages/cli/dist/index.js sites list
   ```
