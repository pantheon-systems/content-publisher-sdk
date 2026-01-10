import { ServersideSmartComponentMap } from "@pantheon-systems/cpub-react-sdk/components";

const serverSmartComponentMap: ServersideSmartComponentMap = {
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
    exampleImageUrl:
      "https://storage.googleapis.com/pcc-prod-user-uploads/preview-media-preview.png",
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
};

export { serverSmartComponentMap };
