import { IndicatorBadge as BaseIndicatorBadge } from "@pantheon-systems/pds-toolkit-react";
import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";
import { type ComponentProps } from "react";

type IndicatorBadgeColor = ComponentProps<typeof BaseIndicatorBadge>["color"];

// The PDS component collapsed "variant" (which implied both a color and a
// default label) into a plain "color" + a required "label". This preserves
// the old per-variant default label and color choice; "early-access" has no
// literal color equivalent, so it maps to the closest available one.
const VARIANT_TO_COLOR: Record<string, IndicatorBadgeColor> = {
  silver: "silver",
  gold: "gold",
  platinum: "platinum",
  diamond: "diamond",
  "early-access": "priority",
};
const VARIANT_DEFAULT_LABEL: Record<string, string> = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  "early-access": "Early Access",
};

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
      color={VARIANT_TO_COLOR[variant] ?? "default"}
      label={customLabel ?? VARIANT_DEFAULT_LABEL[variant] ?? variant}
      className={className}
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
