import { Blockquote as BaseBlockquote } from "@pantheon-systems/pds-toolkit-react";
import { type InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * The Blockquote component is used to show a quote and the quote author in a full-width or inline format.
 */
export const reactComponent = ({
  type,
  quote,
  person,
  source,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseBlockquote
      type={type}
      quote={quote}
      person={person}
      source={source}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Blockquote",
  iconUrl: null,
  fields: {
    /**
     * Quote text
     */
    quote: {
      displayName: "Quote",
      type: "string",
      required: true,
    },
    /**
     * Person who said the quote
     */
    person: {
      displayName: "Person",
      type: "string",
      required: true,
    },
    /**
     * Source of the quote
     */
    source: {
      displayName: "Source",
      type: "string",
      required: true,
    },
    /**
     * Set type to full width or inline blockquote
     * @default full-width
     */
    type: {
      displayName: "Type",
      type: "enum",
      required: false,
      options: [
        {
          label: "Full width",
          value: "full-width",
        },
        {
          label: "Inline",
          value: "inline",
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
