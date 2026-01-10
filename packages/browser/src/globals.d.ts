import { type PantheonClient } from "@pantheon-systems/cpub-sdk-core";

declare global {
  interface Window {
    __PANTHEON_CLIENT?: PantheonClient;
  }
}
