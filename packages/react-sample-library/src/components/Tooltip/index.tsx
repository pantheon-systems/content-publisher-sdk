import { Tooltip as BaseTooltip } from "@pantheon-systems/pds-toolkit-react";
import { type InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * A brief message to give more context to an elements
 */
export const reactComponent = ({
  content,
  triggerIcon,
  triggerAccessibleText,
  triggerText,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseTooltip
      content={content}
      triggerIcon={triggerIcon}
      triggerAccessibleText={triggerAccessibleText}
      triggerText={triggerText}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Tooltip",
  iconUrl: null,
  fields: {
    /**
     * Text to display in tooltip
     */
    content: {
      displayName: "Content",
      type: "string",
      required: true,
    },
    /**
     * Text to use as the trigger instead of an icon. Leave blank to use the icon.
     */
    triggerText: {
      displayName: "Trigger text",
      type: "string",
      required: false,
    },
    /**
     * Icon to trigger tooltip
     * @default circleInfo
     */
    triggerIcon: {
      displayName: "Trigger Icon",
      type: "enum",
      required: false,
      options: [
        {
          label: "Circle info",
          value: "circleInfo",
        },
        {
          label: "Circle question",
          value: "circleQuestion",
        },
        {
          label: "Circle exclamation",
          value: "circleExclamation",
        },
      ],
    },
    /**
     * The accessible text for the trigger. Only necessary when the trigger is an icon.
     */
    triggerAccessibleText: {
      displayName: "Trigger accessible text",
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
