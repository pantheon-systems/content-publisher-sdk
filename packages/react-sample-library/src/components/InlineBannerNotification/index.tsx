import { InlineMessage as BaseInlineBannerNotification } from "@pantheon-systems/pds-toolkit-react";
import { type InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * A message that is displayed inline with other content
 */
export const reactComponent = ({
  title,
  text,
  type,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseInlineBannerNotification
      title={title}
      text={text}
      type={type}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Inline Banner Notification",
  iconUrl: null,
  fields: {
    /**
     * Text for the title section
     */
    title: {
      displayName: "Title",
      type: "string",
      required: true,
    },
    /**
     * Banner style and Icon types
     */
    type: {
      displayName: "Type",
      type: "enum",
      required: true,
      options: [
        {
          label: "Info",
          value: "info",
        },
        {
          label: "Warning",
          value: "warning",
        },
        {
          label: "Critical",
          value: "critical",
        },
        {
          label: "Discovery",
          value: "discovery",
        },
      ],
    },
    /**
     * Text for the message section
     */
    text: {
      displayName: "Message Text",
      type: "string",
      required: false,
    },
    className: {
      displayName: "Additional CSS classes",
      type: "string",
      required: false,
    },
  },
} as const;
