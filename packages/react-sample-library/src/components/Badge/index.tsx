import { Badge as BaseBadge } from "@pantheon-systems/pds-toolkit-react";
import { type InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * A visual label to convey a status
 */
export const reactComponent = ({
  statusType,
  label,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseBadge
      label={label}
      statusType={statusType}
      hasStatusType={statusType != null}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Badge",
  iconUrl: null,
  fields: {
    /**
     * Text to display in the badge
     */
    label: {
      displayName: "Label",
      type: "string",
      required: true,
    },
    /**
     * Status type for badge. Only renders if `hasStatusType` is true.
     */
    statusType: {
      displayName: "Status Type",
      type: "enum",
      required: false,
      options: [
        {
          label: "Status",
          value: "status",
        },
        {
          label: "Info",
          value: "info",
        },
        {
          label: "Frozen",
          value: "frozen",
        },
        {
          label: "Critical",
          value: "critical",
        },
        {
          label: "Warning",
          value: "warning",
        },
        {
          label: "Discovery",
          value: "discovery",
        },
        {
          label: "Neutral",
          value: "neutral",
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
