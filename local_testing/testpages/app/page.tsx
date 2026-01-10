"use client";

import { Blockquote } from "@pantheon-systems/cpub-react-sample-library";
import "@pantheon-systems/cpub-react-sample-library/dist/css/pds-core.css";
import "@pantheon-systems/cpub-react-sample-library/dist/css/pds-layouts.css";
import "@pantheon-systems/cpub-react-sample-library/dist/css/pds-components.css";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <Blockquote.reactComponent
          type="full-width"
          quote="Live in the sunshine, swim the sea, drink the wild air."
          person="R. Waldo Emerson"
          source="A book somewhere"
        />
      </div>
    </main>
  );
}
