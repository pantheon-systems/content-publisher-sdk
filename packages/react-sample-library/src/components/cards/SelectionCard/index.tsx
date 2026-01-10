import { SelectionCard as BaseCard } from "@pantheon-systems/pds-toolkit-react";
import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

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
    <BaseCard
      selectionLink={<a href={selectionLinkURL}>{selectionLinkText}</a>}
      title={title}
      badge={badge}
      icon={icon}
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
