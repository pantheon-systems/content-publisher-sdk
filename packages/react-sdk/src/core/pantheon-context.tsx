import { ApolloClient } from "@apollo/client/core/ApolloClient.js";
import { ApolloProvider } from "@apollo/client/react/context/ApolloProvider.js";
import { PantheonClient } from "@pantheon-systems/cpub-sdk-core";
import React, { PropsWithChildren } from "react";

interface PantheonProviderProps extends PropsWithChildren<object> {
  client: PantheonClient;
}

const PantheonContext = React.createContext<PantheonClient | null>(null);

export const PantheonProvider = ({
  client,
  children,
}: PantheonProviderProps) => (
  <PantheonContext.Provider value={client}>
    <ApolloProvider
      client={client.apolloClient as unknown as ApolloClient<unknown>}
    >
      {children}
    </ApolloProvider>
  </PantheonContext.Provider>
);

export const usePantheonClient = () => {
  const client = React.useContext(PantheonContext);

  if (!client) {
    throw new Error("Cannot use outside of a PantheonProvider");
  }

  return client;
};
