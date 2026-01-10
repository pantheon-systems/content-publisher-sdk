import { SmartComponentMap } from "@pantheon-systems/cpub-react-sdk/components";
import LeadCapture from "./lead-capture";
import MediaPreview from "./media-preview";
import { serverSmartComponentMap } from "./server-components";
import TileNavigation from "./tile-navigation";

const clientSmartComponentMap: SmartComponentMap = {
  LEAD_CAPTURE: {
    ...serverSmartComponentMap.LEAD_CAPTURE,
    reactComponent: LeadCapture,
  },
  MEDIA_PREVIEW: {
    ...serverSmartComponentMap.MEDIA_PREVIEW,
    reactComponent: MediaPreview,
  },
  TILE_NAVIGATION: {
    ...serverSmartComponentMap.TILE_NAVIGATION,
    reactComponent: TileNavigation,
  },
};

export { clientSmartComponentMap };
