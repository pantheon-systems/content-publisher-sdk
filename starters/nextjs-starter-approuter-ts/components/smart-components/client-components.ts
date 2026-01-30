import { SmartComponentMap } from "@pantheon-systems/cpub-react-sdk/components";
import React from "react";
import LeadCapture from "./lead-capture";
import MediaPreview from "./media-preview";
import { serverSmartComponentMap } from "./server-components";
import TileNavigation from "./tile-navigation";

const clientSmartComponentMap: SmartComponentMap = {
  LEAD_CAPTURE: {
    ...serverSmartComponentMap.LEAD_CAPTURE,
    reactComponent: LeadCapture as (props: unknown) => React.JSX.Element,
  },
  MEDIA_PREVIEW: {
    ...serverSmartComponentMap.MEDIA_PREVIEW,
    reactComponent: MediaPreview as (props: unknown) => React.JSX.Element,
  },
  TILE_NAVIGATION: {
    ...serverSmartComponentMap.TILE_NAVIGATION,
    reactComponent: TileNavigation as (props: unknown) => React.JSX.Element,
  },
};

export { clientSmartComponentMap };
