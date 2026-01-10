import { Avatar as BaseAvatar } from "@pantheon-systems/pds-toolkit-react";
import { type InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * A visual representation of a user or organization
 */
export const reactComponent = ({
  image,
  size,
  className,
  fallbackIcon,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseAvatar
      imageSrc={image}
      avatarSize={size}
      className={className}
      fallbackIcon={fallbackIcon}
    />
  );
};

export const smartComponentDefinition = {
  title: "Avatar",
  iconUrl: null,
  fields: {
    /**
     * Link to the image to display in the avatar
     */
    image: {
      type: "file",
      required: false,
      displayName: "Image URL",
    },
    /**
     * Size of the avatar
     */
    size: {
      displayName: "Size",
      type: "enum",
      required: false,
      options: [
        {
          label: "Small",
          value: "sm",
        },
        {
          label: "Medium",
          value: "md",
        },
      ],
    },
    /**
     * Icon to use if image is not provided
     */
    fallbackIcon: {
      displayName: "Fallback Icon",
      type: "enum",
      required: false,
      options: [
        {
          label: "Avatar showing one user",
          value: "user",
        },
        {
          label: "Avatar showing multiple users",
          value: "users",
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
