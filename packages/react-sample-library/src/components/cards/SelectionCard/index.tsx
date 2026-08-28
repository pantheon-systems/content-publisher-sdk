import { NewSiteCard } from "@pantheon-systems/pds-toolkit-react";
import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";
import { type ComponentProps } from "react";

type NewSiteCardIcon = ComponentProps<typeof NewSiteCard>["icon"];

// SelectionCard was replaced by NewSiteCard, which renamed 3 of the platform
// icon values; the field's stored option values are kept as-is (so existing
// customer content doesn't need to change) and translated here at render time.
const ICON_VALUE_MAP: Record<string, NewSiteCardIcon> = {
  "drupal-next": "next-drupal",
  "wp-gatsby": "gatsby-wp",
  "wp-next": "next-wp",
};

/**
 * Cards for displaying multiple choices that begin a user flow
 */
export const reactComponent = ({
  selectionLinkText,
  selectionLinkURL,
  title,
  badge,
  icon,
  subtitle,
  summary,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <NewSiteCard
      selectionLink={<a href={selectionLinkURL}>{selectionLinkText}</a>}
      title={title}
      badge={badge}
      icon={icon ? ICON_VALUE_MAP[icon] ?? (icon as NewSiteCardIcon) : icon}
      subtitle={subtitle}
      summary={summary}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Selection Card",
  iconUrl: null,
  fields: {
    /**
     * Card title
     */
    title: {
      displayName: "Card title",
      type: "string",
      required: true,
    },
    /**
     * The primary link for the selection card.
     */
    selectionLinkText: {
      displayName: "Primary link text",
      type: "string",
      required: true,
    },
    /**
     * The primary link for the selection card.
     */
    selectionLinkURL: {
      displayName: "Primary link URL",
      type: "string",
      required: true,
    },
    /**
     * Card subtitle
     */
    subtitle: {
      displayName: "Card subtitle",
      type: "string",
      required: false,
    },
    /**
     * Card summary
     */
    summary: {
      displayName: "Card summary",
      type: "string",
      required: false,
    },
    /**
     * Choose from only Platform Icons at this time.
     */
    icon: {
      displayName: "Icon",
      type: "enum",
      required: false,
      options: [
        "drupal",
        "wordpress",
        "gatsby",
        "next",
        "import-custom",
        "drupal-next",
        "wp-gatsby",
        "wp-next",
      ],
    },
    /**
     * Optional indicator badge type. Choose from only early-access at this time.
     */
    badge: {
      displayName: "Badge",
      type: "enum",
      required: false,
      options: ["early-access"],
    },
    className: {
      displayName: "Additional CSS classes",
      type: "string",
      required: false,
    },
  },
} as const;
