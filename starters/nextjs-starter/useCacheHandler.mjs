import { createUseCacheHandler } from "@pantheon-systems/nextjs-cache-handler/use-cache";

const UseCacheHandler = createUseCacheHandler({
  type: "auto",
});

export default UseCacheHandler;
