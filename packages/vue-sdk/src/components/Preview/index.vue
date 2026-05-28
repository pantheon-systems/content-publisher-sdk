<script setup lang="ts">
import type { PreviewBarProps } from "../Renderer";
import queryString from "query-string";
import { PropType, ref, watchEffect } from "vue-demi";

import IconDocs from "./assets/IconDocs.vue";
import IconExport from "./assets/IconExport.vue";
import IconShare from "./assets/IconShare.vue";
import LivePreviewIndicator from "./LivePreviewIndicator.vue";
import HoverButton from "../Common/HoverButton.vue";
import { getCookie } from "../../utils/cookies";
import { Article } from "@pantheon-systems/cpub-sdk-core/types";

const props = defineProps({
  article: Object as PropType<Article>,
  previewBarOverride: {
    type: Object as PropType<PreviewBarProps["previewBarOverride"]>,
    required: false,
  },
});

const isLive = ref(false);
const isHidden = ref(false);
const hasCopied = ref(false);
const copyResetTimeoutId = ref<NodeJS.Timeout | null>(null);
const pccGrant = getCookie("PCC-GRANT");

const maxDocTitleLength = 51;
const truncatedDocTitle =
  props?.article?.title != null &&
  props?.article?.title?.length >= maxDocTitleLength
    ? `${props?.article?.title.substring(0, maxDocTitleLength)}...`
    : props?.article?.title || "";

function copyURL() {
  if (copyResetTimeoutId.value) {
    clearTimeout(copyResetTimeoutId.value);
    copyResetTimeoutId.value = null;
  }

  const parsedUrl = queryString.parseUrl(window.location.href, {
    parseFragmentIdentifier: true,
  });

  const query = {
    pccGrant,
    ...parsedUrl.query,
  };

  navigator.clipboard.writeText(
    `${parsedUrl.url}?${queryString.stringify(query)}${
      parsedUrl.fragmentIdentifier ? `#${parsedUrl.fragmentIdentifier}` : ""
    }`,
  );

  hasCopied.value = true;

  // Reset the copied state after 2 seconds
  const timeoutId = setTimeout(() => {
    hasCopied.value = false;
  }, 2000);

  copyResetTimeoutId.value = timeoutId;
}

watchEffect(() => {
  const article = props.article;

  if (!article?.previewActiveUntil) return;

  const livePreviewTimeRemaining = article.previewActiveUntil - Date.now();
  if (livePreviewTimeRemaining >= 100) {
    isLive.value = true;
    setTimeout(() => {
      isLive.value = false;
    }, livePreviewTimeRemaining);
  }
});
</script>

<template>
  <div v-if="previewBarOverride">
    <component
      :is="previewBarOverride"
      :article="article"
      :isHidden="isHidden"
    />
  </div>

  <div v-else :class="['wrapper', isHidden && 'hidden']">
    <div v-if="!isHidden" class="container">
      <a
        class="title-link"
        :href="`https://docs.google.com/document/d/${article.id}/edit`"
        rel="noreferrer"
        target="_blank"
      >
        <IconDocs />
        <span>{{ truncatedDocTitle }}</span>
        <IconExport />
      </a>
      <div class="lpi-wrapper">
        <LivePreviewIndicator :isLive="isLive" />

        <div class="end-block">
          <div class="copy-url-container">
            <button @click="copyURL">
              <IconShare :flip="true" />
              {{ hasCopied ? "Copied URL" : "Share preview URL" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  font-family: sans-serif;
  z-index: 5;
  position: absolute;
  top: 0;
  width: 100%;
  transition: all 0.2s ease-in-out;
  display: flex;
  justify-content: flex-end;
  background: white;

  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.08),
    0px 8px 8px -8px rgba(0, 0, 0, 0.04);
  padding: 15px 0;
}

.wrapper.hidden {
  border-bottom: 1px solid transparent;
  background: transparent;
}

.container {
  padding: 32px;
  padding-block: 8px;
  display: grid;
  gap: 1em;
  width: 100%;

  @media (min-width: 768px) {
    padding-block: 0;
    grid-auto-flow: column;
    grid-template-columns: 0.45fr 0.55fr;
  }
}

.title-link {
  display: flex;
  flex-direction: row;
  column-gap: 10px;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #23232d;
  min-width: 0;

  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  > svg {
    flex-shrink: 0;
  }
}

.end-block {
  display: flex;
  flex-direction: row;
  column-gap: 4px;
  align-items: center;
  justify-content: flex-end;
}

.copy-url-container {
  > button {
    height: 100%;
    padding: 8px 13px;
    background-color: #3017a1;
    color: white;
    border-radius: 3px;
    font-size: 0.875rem;
    font-weight: 600;
    column-gap: 5px;

    display: flex;
    align-items: center;

    &:hover {
      opacity: 0.8;
    }
  }
}

.lpi-wrapper {
  display: flex;
  justify-content: space-between;
  column-gap: 10px;
  align-items: center;
}

.controller-container {
  cursor: pointer;
  padding: 16px;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    padding: 8px;
    align-items: flex-start;
  }
}

.controller-container.active {
  background: #f1f1f1;
  border-radius: 3px;
  box-shadow: 0px 3px 8px 0px #00000026;

  > div {
    display: flex;
    flex-direction: row;
    column-gap: 10px;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
