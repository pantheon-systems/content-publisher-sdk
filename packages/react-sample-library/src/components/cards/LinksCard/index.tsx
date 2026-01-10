import { LinksCard as BaseCard } from "@pantheon-systems/pds-toolkit-react";
import {
  InferSmartComponentProps,
  SmartComponentMap,
} from "@pantheon-systems/cpub-sdk-core";

/**
 * Links Card UI component
 */
export const reactComponent = ({
  headingText,
  links,
  headingLevel = "h2",
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  const linkItems = (links || []).map((link) => (
    <a href={link.href}>{link.linkText}</a>
  ));
  return (
    <BaseCard
      headingText={headingText}
      linkItems={linkItems}
      headingLevel={headingLevel}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Links Card",
  iconUrl: null,
  fields: {
    /**
     * Link Card heading.
     */
    headingText: {
      displayName: "Heading text",
      type: "string",
      required: true,
    },
    /**
     * Link items
     */
    links: {
      displayName: "Links",
      type: "object",
      multiple: true,
      required: true,
      fields: {
        /**
         * Link text
         */
        linkText: {
          displayName: "Link text",
          type: "string",
          required: true,
        },
        /**
         * Link location
         */
        href: {
          displayName: "Link URL",
          type: "string",
          required: true,
        },
      },
    },
    /**
     *  Heading level
     */
    headingLevel: {
      displayName: "Heading level",
      type: "enum",
      required: false,
      options: ["h2", "h3", "h4"],
    },
    className: {
      displayName: "Additional CSS classes",
      type: "string",
      required: false,
    },
  },
} as const satisfies SmartComponentMap[string];
