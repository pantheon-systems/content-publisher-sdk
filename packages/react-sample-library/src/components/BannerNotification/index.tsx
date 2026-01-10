import { Banner as BaseBannerNotification } from "@pantheon-systems/pds-toolkit-react";
import { type InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

export const reactComponent = ({
  message,
  type,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseBannerNotification
      message={message}
      type={type}
      className={className}
    />
  );
};

/**
 * A prominent user message displayed at the top of the page
 */
export const smartComponentDefinition = {
  title: "Banner Notification",
  iconUrl: null,
  fields: {
    /**
     * The message to display
     */
    message: {
      displayName: "Message",
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
          label: "Warning",
          value: "warning",
        },
        {
          label: "Critical",
          value: "critical",
        },
        {
          label: "Info",
          value: "info",
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
