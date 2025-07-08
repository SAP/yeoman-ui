<template>
  <!-- Banner container -->
  <v-banner
    :class="
      bannerProps.triggerActionFrom === 'banner'
        ? 'banner-container banner-hover mb-6 mt-2'
        : 'banner-container mb-6 mt-2'
    "
    role="banner"
    elevation="0"
    :aria-label="bannerProps.ariaLabel"
    flat
    @click="bannerProps.triggerActionFrom === 'banner' ? triggerCommand(bannerProps.action?.command) : null"
  >
    <!-- Banner content -->
    <div class="banner-content">
      <!-- Banner icon -->
      <div class="banner-icon">
        <!-- Render image if icon type is "image" -->
        <img v-if="bannerProps.icon?.type === 'image'" :src="bannerProps.icon?.source" :alt="bannerProps.ariaLabel" />
        <!-- Render v-icon if icon type is "mdi" -->
        <v-icon v-else-if="bannerProps.icon?.type === 'mdi'">
          {{ bannerProps.icon?.source }}
        </v-icon>
      </div>

      <!-- Banner text and actions -->
      <div class="banner-text">
        <span>{{ bannerProps.text }}</span>

        <!-- Render action for "banner" trigger -->
        <span v-if="bannerProps.triggerActionFrom === 'banner' && bannerProps.action?.text" class="banner-link-text">
          {{ bannerProps.action?.text }}
        </span>

        <!-- Render clickable command link for "link" trigger -->
        <span
          v-if="bannerProps.triggerActionFrom === 'link' && bannerProps.action?.text && bannerProps.action?.command"
          class="banner-link-text banner-link-hover"
        >
          <a href="javascript:void(0)" @click="triggerCommand(bannerProps.action?.command)">
            {{ bannerProps.action?.text }}
          </a>
        </span>

        <!-- Render clickable URL link for "link" trigger -->
        <span
          v-if="bannerProps.triggerActionFrom === 'link' && bannerProps.action?.url"
          class="banner-link-text banner-link-hover"
        >
          <a :href="bannerProps.action?.url" target="_blank">
            {{ bannerProps.action?.text }}
          </a>
        </span>
      </div>
    </div>
  </v-banner>
</template>

<script setup>
import { toRefs, defineEmits } from "vue";

const props = defineProps({
  bannerProps: {
    type: Object,
    required: true,
    default: () => ({
      text: "",
      ariaLabel: "Banner",
      icon: {},
      action: {},
      triggerActionFrom: "banner",
    }),
  },
});

const emit = defineEmits(["parent-execute-command"]);
const { bannerProps } = toRefs(props);

/**
 * Trigger the command action and emit the event to the parent component
 * @param {Object} event - The event object
 */
const triggerCommand = (event) => {
  emit("parent-execute-command", event);
};
</script>

<style lang="scss">
// Define color variables
$icon-background-color: #005fb8;
$background-color: var(--vscode-editorWidget-background, #f8f8f8);
$focus-border-color: var(--vscode-focusBorder, $icon-background-color);
$text-link-color: var(--vscode-textLink-foreground, $icon-background-color);

// Banner container styles
.v-banner.banner-container {
  background-color: $background-color;
  border-radius: 3px;
  padding: 12px;
  box-shadow: 0px 4px 8px 0px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.1)) !important;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  height: auto;
  border: 1px solid var(--vscode-editorWidget-border, #c8c8c8);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &.banner-hover {
    cursor: pointer;
  }

  &:hover {
    border: 1px solid $focus-border-color;
    box-shadow: 0px 6px 12px 0px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.2)) !important;

    .banner-link-text {
      text-decoration: none;
    }
  }
}

// Banner content styles
.banner-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

// Banner icon styles
.banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $icon-background-color;
  padding: 4px;
  width: 24px;
  height: 24px;
  border-radius: 2px;
  flex: none;

  img,
  v-icon {
    object-fit: scale-down;
    width: 100%;
    height: 100%;
  }
}

// Banner text styles
.banner-text {
  white-space: normal;
  color: var(--vscode-foreground, #3b3b3b);
  font-size: 13px;
  line-height: 1.5;
}

// Banner link text styles
.banner-link-text {
  color: $text-link-color;
  text-decoration: underline;
  font-weight: bold;
  width: fit-content;
  cursor: pointer;
  transition:
    color 0.2s ease,
    text-decoration 0.2s ease;

  &:hover {
    text-decoration: none;
  }
}
</style>
