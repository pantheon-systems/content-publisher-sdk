import { IndicatorBadge as BaseIndicatorBadge } from "@pantheon-systems/pds-toolkit-react";
import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * A visual label to indicate a special status or category
 */
export const reactComponent = ({
  variant,
  customLabel,
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseIndicatorBadge
      variant={variant}
      className={className}
      customLabel={customLabel}
    />
  );
};

export const smartComponentDefinition = {
  title: "Indicator Badge",
  iconUrl: null,
  fields: {
    /**
     * Badge variant
     */
    variant: {
      displayName: "Variant",
      type: "enum",
      required: true,
      options: [
        {
          label: "Silver",
          value: "silver",
        },
        {
          label: "Gold",
          value: "gold",
        },
        {
          label: "Platinum",
          value: "platinum",
        },
        {
          label: "Diamond",
          value: "diamond",
        },
        {
          label: "Early Access",
          value: "early-access",
        },
      ],
    },
    /**
     * Optional custom label, will override the default label for each variant.
     */
    customLabel: {
      displayName: "Custom Label",
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
