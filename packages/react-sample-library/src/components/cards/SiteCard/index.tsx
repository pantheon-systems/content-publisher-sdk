import { SiteCard as BaseCard } from "@pantheon-systems/pds-toolkit-react";
import { InferSmartComponentProps } from "@pantheon-systems/cpub-sdk-core";

/**
 * Cards for displaying site information
 */
export const reactComponent = ({
  siteLinkText,
  siteLinkURL,
  siteName,
  siteImage,
  sitePlan,
  siteStatus,
  gotoText,
  headingLevel = "h2",
  className,
}: InferSmartComponentProps<typeof smartComponentDefinition>) => {
  return (
    <BaseCard
      siteLink={<a href={siteLinkURL}>{siteLinkText}</a>}
      siteName={siteName}
      siteImage={siteImage}
      sitePlan={sitePlan}
      siteStatus={siteStatus}
      gotoText={gotoText}
      headingLevel={headingLevel}
      className={className}
    />
  );
};

export const smartComponentDefinition = {
  title: "Site Card",
  iconUrl: null,
  fields: {
    /**
     * Name of the site.
     */
    siteName: {
      displayName: "Site name",
      type: "string",
      required: true,
    },
    /**
     * Site dashboard link text.
     */
    siteLinkText: {
      displayName: "Site link text",
      type: "string",
      required: true,
    },
    /**
     * Site dashboard link url.
     */
    siteLinkURL: {
      displayName: "Site link URL",
      type: "string",
      required: true,
    },
    /**
     * Thumbnail image of the site.
     */
    siteImage: {
      displayName: "Site thumbnail image URL",
      type: "file",
      required: true,
    },
    /**
     * Plan level for the site.
     */
    sitePlan: {
      displayName: "Site plan",
      type: "string",
      required: true,
    },
    /**
     * Status of the site.
     */
    siteStatus: {
      displayName: "Site status",
      type: "enum",
      required: true,
      options: ["Active", "Frozen"],
    },
    /**
     * Text for link to site dashboard.
     */
    gotoText: {
      displayName: "Goto text",
      type: "string",
      required: false,
    },
    /**
     *  Heading level or `span`.
     */
    headingLevel: {
      displayName: "Heading level",
      type: "enum",
      required: false,
      options: ["h2", "h3", "h4", "span"],
    },
    className: {
      displayName: "Additional CSS classes",
      type: "string",
      required: false,
    },
  },
} as const;
