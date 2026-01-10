import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core/types";
import { Card as BaseCard } from "@pantheon-systems/pds-toolkit-react";

/**
 * A container to summarize information with a subsequent call to action
 */
export const reactComponent = ({
  headingText,
  primaryLinkText,
  primaryLinkUrl,
  headingLevel,
  image,
  imageAlt,
  kickerText,
  bodyText,
  secondaryLinkText,
  elementToRender,
  secondaryLinkUrl,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  const primaryLink = {
    text: primaryLinkText,
    url: primaryLinkUrl,
    target: "_self" as const,
  };
  const secondaryLink =
    secondaryLinkText && secondaryLinkUrl
      ? {
          text: secondaryLinkText,
          url: secondaryLinkUrl,
          target: "_self" as const,
        }
      : undefined;
  const imageProp = image
    ? {
        src: image,
        alt: imageAlt ?? "",
      }
    : undefined;

  return (
    <BaseCard
      headingText={headingText}
      headingLevel={headingLevel}
      primaryLink={primaryLink}
      secondaryLink={secondaryLink}
      image={imageProp}
      kickerText={kickerText}
      bodyText={bodyText}
      elementType={elementToRender}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Card",
  iconUrl: null,
  fields: {
    /**
     * Heading for card
     */
    headingText: {
      displayName: "Heading Text",
      type: "string",
      required: true,
    },
    /**
     * Text for primary link
     */
    primaryLinkText: {
      displayName: "Primary Link Text",
      type: "string",
      required: true,
    },
    /**
     * Url for primary link
     */
    primaryLinkUrl: {
      displayName: "Primary Link URL",
      type: "string",
      required: true,
    },
    /**
     * Heading level for card
     * @default "h2"
     */
    headingLevel: {
      displayName: "Heading Level",
      type: "enum",
      required: false,
      options: [
        {
          label: "h2",
          value: "h2",
        },
        {
          label: "h3",
          value: "h3",
        },
        {
          label: "h4",
          value: "h4",
        },
        {
          label: "span",
          value: "span",
        },
      ],
    },
    /**
     * Link to image for card
     */
    image: {
      displayName: "Image",
      type: "file",
      required: false,
    },
    /**
     * Alt text for image
     */
    imageAlt: {
      displayName: "Image Alt",
      type: "string",
      required: false,
    },
    /**
     * Card kicker text
     */
    kickerText: {
      displayName: "Kicker Text",
      type: "string",
      required: false,
    },
    /**
     * Short description or summary.
     */
    bodyText: {
      displayName: "Body Text",
      type: "string",
      required: false,
    },
    /**
     * Text for secondary link
     */
    secondaryLinkText: {
      displayName: "Secondary Link Text",
      type: "string",
      required: false,
    },
    /**
     * Url for secondary link
     */
    secondaryLinkUrl: {
      displayName: "Secondary Link URL",
      type: "string",
      required: false,
    },
    /**
     * Element to render card as
     * @default "div"
     */
    elementToRender: {
      displayName: "Element to render",
      type: "enum",
      required: false,
      options: [
        {
          label: "div",
          value: "div",
        },
        {
          label: "article",
          value: "article",
        },
        {
          label: "aside",
          value: "aside",
        },
      ],
    },
    className: {
      displayName: "Additional CSS classes",
      type: "string",
      required: false,
    },
  },
} as const;
