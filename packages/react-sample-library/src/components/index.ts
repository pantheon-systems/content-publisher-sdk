import {
  ServersideSmartComponentMap,
  SmartComponentMap,
} from "@pantheon-systems/cpub-react-sdk/components";
import * as Avatar from "./Avatar";
import * as Badge from "./Badge";
import * as IndicatorBadge from "./IndicatorBadge";
import * as BannerNotification from "./BannerNotification";
import * as Blockquote from "./Blockquote";
import * as CTALink from "./CTALink";
import * as Card from "./cards/Card";
import * as SelectionCard from "./cards/SelectionCard";
import * as SiteCard from "./cards/SiteCard";
import * as LinksCard from "./cards/LinksCard";
import * as InlineBannerNotification from "./InlineBannerNotification";
import * as SectionBannerNotification from "./SectionBannerNotification";
import * as Tooltip from "./Tooltip";

// Adding a PANTHEON_ prefix to help developers using
// this library avoid naming conflicts.
export const ClientSmartComponentMap: SmartComponentMap = {
  PANTHEON_AVATAR: {
    ...Avatar.smartComponentDefinition,
    reactComponent: Avatar.reactComponent,
  },
  PANTHEON_BADGE: {
    ...Badge.smartComponentDefinition,
    reactComponent: Badge.reactComponent,
  },
  PANTHEON_CARD: {
    ...Card.smartComponentDefinition,
    reactComponent: Card.reactComponent,
  },
  PANTHEON_SELECTION_CARD: {
    ...SelectionCard.smartComponentDefinition,
    reactComponent: SelectionCard.reactComponent,
  },
  PANTHEON_SITE_CARD: {
    ...SiteCard.smartComponentDefinition,
    reactComponent: SiteCard.reactComponent,
  },
  PANTHEON_LINKS_CARD: {
    ...LinksCard.smartComponentDefinition,
    reactComponent: LinksCard.reactComponent,
  },
  PANTHEON_INDICATOR_BADGE: {
    ...IndicatorBadge.smartComponentDefinition,
    reactComponent: IndicatorBadge.reactComponent,
  },
  PANTHEON_BANNER_NOTIFICATION: {
    ...BannerNotification.smartComponentDefinition,
    reactComponent: BannerNotification.reactComponent,
  },
  PANTHEON_BLOCKQUOTE: {
    ...Blockquote.smartComponentDefinition,
    reactComponent: Blockquote.reactComponent,
  },
  PANTHEON_CTA_LINK: {
    ...CTALink.smartComponentDefinition,
    reactComponent: CTALink.reactComponent,
  },
  PANTHEON_INLINE_BANNER_NOTIFICATION: {
    ...InlineBannerNotification.smartComponentDefinition,
    reactComponent: InlineBannerNotification.reactComponent,
  },
  PANTHEON_SECTION_BANNER_NOTIFICATION: {
    ...SectionBannerNotification.smartComponentDefinition,
    reactComponent: SectionBannerNotification.reactComponent,
  },
  PANTHEON_TOOLTIP: {
    ...Tooltip.smartComponentDefinition,
    reactComponent: Tooltip.reactComponent,
  },
};

// Clone the client-side map and remove reactComponent from each entry.
export const ServerSmartComponentMap: ServersideSmartComponentMap = {};

Object.entries(ClientSmartComponentMap).forEach(([k, v]) => {
  const serverSideConfig: Omit<typeof v, "reactComponent"> &
    Partial<{
      reactComponent: unknown;
    }> = Object.assign({}, v);
  delete serverSideConfig.reactComponent;
  ServerSmartComponentMap[k] = serverSideConfig;
});

export {
  Avatar,
  Badge,
  Card,
  IndicatorBadge,
  BannerNotification,
  Blockquote,
  CTALink,
  InlineBannerNotification,
  SectionBannerNotification,
  Tooltip,
};
