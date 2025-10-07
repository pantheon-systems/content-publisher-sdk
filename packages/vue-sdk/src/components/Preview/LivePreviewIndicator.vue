<script setup lang="ts">
import IconDot from "./assets/IconDot.vue";
import IconInfo from "./assets/IconInfo.vue";

import { Tooltip } from "floating-vue";

defineProps({
  isLive: Boolean,
});
</script>

<template>
  <div class="lpi-container">
    <IconDot :fill="isLive ? '#218C5F' : '#CFCFD3'" />
    <span>{{ isLive ? "Page preview: On" : "Page preview: Off" }}</span>

    <Tooltip>
      <div class="info-tooltip-button">
        <button v-if="!isLive">
          <IconInfo />
        </button>
      </div>

      <template #popper>
        <div class="info-tooltip">
          <span>
            This preview page is no longer connected to the document (updates to
            the document will not be displayed until this is reconnected).
          </span>
          <br />
          <br />
          <span>
            To reconnect, navigate to the document and select the
            &apos;Preview&apos; button in the Content Publisher add-on.
          </span>
        </div>
      </template>
    </Tooltip>
  </div>
</template>

<style scoped lang="scss">
@import "floating-vue/dist/style.css";

.lpi-container {
  border: 1px solid #cfcfd3;
  font-family: Poppins, sans-serif;
  font-weight: 500;
  display: flex;
  align-items: center;
  border-radius: 100px;
  color: #6d6d78;
  padding: 0 8px;
  font-size: 12px;
  flex-direction: row;
  width: fit-content;
  height: 24px;

  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 8px;
  }

  > button {
    margin-left: 8px;
  }
}

.info-tooltip-button {
  display: flex;
  margin-left: 8px;
}

.info-tooltip {
  background: #23232d;
  color: #fff;
  width: 320px;
  border-radius: 6px;
  padding: 16px 19px;
  line-height: 120%;
  letter-spacing: 0.04em;
  box-shadow:
    0px 0px 0px 1px rgba(0, 0, 0, 0.08),
    0px 1px 1px rgba(0, 0, 0, 0.02),
    0px 8px 16px -4px rgba(0, 0, 0, 0.04),
    0px 24px 32px -8px rgba(0, 0, 0, 0.06);
}
</style>
