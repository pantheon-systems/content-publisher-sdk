import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core/types";
import {
  ButtonLink,
  Card as BaseCard,
  CardHeading,
  Picture,
} from "@pantheon-systems/pds-toolkit-react";
import { createElement } from "react";

// PDS removed this rich, content-driven Card shape (heading/kicker/image/
// body/two links) in pds-toolkit-react v1.0.0-dev.187 (2024-11-08),
// refactoring Card into a generic composable primitive ("base for other card
// components") and adding CardHeading alongside it -- the same pattern every
// other card in this library (SiteCard, NewSiteCard, LinksCard, PricingCard,
// etc.) now builds on top of. There is no successor component that covers
// this exact shape, so this recomposes it from PDS primitives ourselves,
// matching how PDS expects consumers to build their own card variants: base
// Card (container) + CardHeading (reused for both the heading and, at a
// smaller scale, the kicker label -- PDS has no dedicated "kicker" component)
// + Picture (image) + ButtonLink (both links). Only the body copy has no PDS
// equivalent and is a plain paragraph.
//
// One capability is dropped rather than reimplemented: the old `elementType`
// prop rendered the card's OWN root element as div/article/aside. The new
// Card is hardcoded to a div, so `elementToRender` is instead applied to a
// wrapping element -- semantically close, but no longer the card's actual
// root element. Flagging in case that distinction matters to any consumer.
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
  return createElement(
    elementToRender ?? "div",
    null,
    <BaseCard className={className}>
      {image && (
        <Picture srcWebp={image} srcFallback={image} alt={imageAlt ?? ""} />
      )}
      {kickerText && (
        <CardHeading
          text={kickerText}
          level="span"
          fontSize="L"
          fontWeight="semibold"
        />
      )}
      <CardHeading text={headingText} level={headingLevel ?? "h2"} />
      {bodyText && <p>{bodyText}</p>}
      <ButtonLink
        variant="primary"
        linkContent={<a href={primaryLinkUrl}>{primaryLinkText}</a>}
      />
      {secondaryLinkText && secondaryLinkUrl && (
        <ButtonLink
          variant="secondary"
          linkContent={<a href={secondaryLinkUrl}>{secondaryLinkText}</a>}
        />
      )}
    </BaseCard>,
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
