<template>
  <!-- Banner container -->
  <v-banner
    :class="[
      'banner-container',
      'mb-6',
      'mt-2',
      { 'banner-hover': bannerProps.triggerActionFrom === 'banner' },
      { 'banner-animated': bannerProps.animated },
    ]"
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
        <!-- eslint-disable vue/no-v-html -->
        <!-- 
          v-html is required to render inline SVG for VS Code theme color support.
          - Backend sends base64-encoded SVG with fill="currentColor"
          - Inline SVG (via v-html) allows fill="currentColor" to inherit from parent CSS
          - Parent CSS sets color: var(--vscode-settings-headerForeground) for theme adaptation
        -->
        <div
          v-if="bannerProps.icon?.type === 'image' && isSvgIcon"
          class="themed-image-container"
          :aria-label="bannerProps.ariaLabel"
          v-html="themedIcon"
        ></div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <!-- Render regular img -->
        <img
          v-else-if="bannerProps.icon?.type === 'image'"
          :src="bannerProps.icon?.source"
          :alt="bannerProps.ariaLabel"
        />
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
import { toRefs, defineEmits, computed } from "vue";

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
      animated: false,
    }),
  },
});

const emit = defineEmits(["parent-execute-command"]);
const { bannerProps } = toRefs(props);

/**
 * Check if the icon is an SVG data URI
 */
const isSvgIcon = computed(() => {
  return bannerProps.value.icon?.source?.startsWith("data:image/svg+xml");
});

/**
 * Decode base64 SVG for theme color inheritance
 * Only called when isSvgIcon is true
 *
 * @returns {string} Decoded SVG markup
 */
const themedIcon = computed(() => {
  try {
    const base64 = bannerProps.value.icon?.source?.split(",")[1];
    return base64 ? atob(base64) : "";
  } catch (error) {
    console.error("Failed to decode SVG:", error);
    return "";
  }
});

/**
 * Trigger the command action and emit the event to the parent component
 * @param {Object} event - Event object
 */
const triggerCommand = (event) => {
  emit("parent-execute-command", event);
};
</script>

<style lang="scss">
// Define color variables
$background-color: #005fb8;

// Banner container styles
.v-banner.banner-container {
  position: relative;
  background-color: var(--vscode-peekViewResult-selectionBackground);
  border: 1px solid var(--vscode-contrastBorder, var(--vscode-peekViewResult-selectionBackground));
  color: var(--vscode-settings-headerForeground, var(--vscode-foreground, #3b3b3b));
  border-radius: 100px;
  padding: 12px;
  box-shadow: 0px 4px 8px 0px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.1)) !important;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  height: auto;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &.banner-hover {
    cursor: pointer;
  }

  &:hover {
    border: 1px solid var(--vscode-focusBorder, $background-color) !important;
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
  background-color: var(--vscode-editor-background, $background-color);
  outline: 1px solid var(--vscode-contrastBorder, var(--vscode-peekViewResult-selectionBackground));
  padding: 4px;
  width: 30px;
  height: 30px;
  border-radius: 100px;
  flex: none;

  img,
  v-icon {
    object-fit: scale-down;
    width: 100%;
    height: 100%;
  }
}

.themed-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vscode-settings-headerForeground, var(--vscode-foreground, #3b3b3b));
}

// Banner text styles
.banner-text {
  white-space: normal;
  color: var(--vscode-settings-headerForeground, var(--vscode-foreground, #3b3b3b));
  font-size: 13px;
  line-height: 1.5;
}

// Banner link text styles
.banner-link-text {
  color: var(--vscode-textLink-foreground, $background-color);
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

// Animated effect
.banner-animated::before {
  content: "";
  position: absolute;
  top: -150%;
  left: -150%;
  width: 300%;
  height: 300%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0.35) 50%,
    rgba(255, 255, 255, 0) 60%
  );
  // repeat the animated effect every 10s after the first 4s
  animation:
    animated-first 4s ease-in-out forwards,
    animated-repeat 10s ease-in-out 4s infinite;
  pointer-events: none;
}
@keyframes animated-first {
  0% {
    transform: translateX(-50%);
  }
  50% {
    transform: translateX(50%);
  }
  100% {
    transform: translateX(50%);
  }
}

@keyframes animated-repeat {
  0%,
  60% {
    transform: translateX(-50%);
  }
  80% {
    transform: translateX(50%);
  }
  100% {
    transform: translateX(50%);
  }
}
</style>
