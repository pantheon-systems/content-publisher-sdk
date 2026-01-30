import {
  ServersideSmartComponentMap,
  SmartComponentMap,
} from "@pantheon-systems/cpub-react-sdk/components";
import { withSmartComponentErrorBoundary } from "./error-boundary";
import LeadCapture from "./lead-capture";
import MediaPreview from "./media-preview";
import TileNavigation from "./tile-navigation";

export const serverSmartComponentMap = {
  LEAD_CAPTURE: {
    title: "Lead Capture Form",
    iconUrl: null,
    fields: {
      heading: {
        displayName: "Heading",
        required: true,
        type: "string",
      },
      description: {
        displayName: "Description",
        required: true,
        type: "string",
      },
      inputLabel: {
        displayName: "Input Label",
        required: true,
        type: "string",
      },
      submitButtonText: {
        displayName: "Submit Button Text",
        required: false,
        type: "string",
      },
    },
  },
  MEDIA_PREVIEW: {
    title: "Media Preview",
    iconUrl: null,
    variants: ["standard", "hero"],
    exampleImageUrl: [
      "https://storage.googleapis.com/pcc-prod-user-uploads/preview-media-preview.png",
      "https://pantheon.io/sites/default/files/styles/inline_hero_image/public/2024-03/v1-hero-image%20%281%29_0.webp",
    ],
    fields: {
      url: {
        displayName: "URL",
        required: true,
        type: "string",
      },
    },
  },
  TILE_NAVIGATION: {
    title: "Tile Navigation",
    iconUrl: null,
    fields: {
      documentIds: {
        displayName: "Document Links or IDs",
        required: true,
        type: "string",
        multiple: true,
      },
    },
  },
} satisfies ServersideSmartComponentMap;

export const clientSmartComponentMap: SmartComponentMap = {
  MEDIA_PREVIEW: {
    ...serverSmartComponentMap.MEDIA_PREVIEW,
    reactComponent: withSmartComponentErrorBoundary(
      MediaPreview as unknown as React.ComponentType<Record<string, unknown>>,
    ) as (props: unknown) => React.JSX.Element,
  },
  LEAD_CAPTURE: {
    ...serverSmartComponentMap.LEAD_CAPTURE,
    reactComponent: withSmartComponentErrorBoundary(
      LeadCapture as unknown as React.ComponentType<Record<string, unknown>>,
    ) as (props: unknown) => React.JSX.Element,
  },
  TILE_NAVIGATION: {
    ...serverSmartComponentMap.TILE_NAVIGATION,
    reactComponent: withSmartComponentErrorBoundary(
      TileNavigation as unknown as React.ComponentType<Record<string, unknown>>,
    ) as (props: unknown) => React.JSX.Element,
  },
};
