<template>
  <v-banner 
    class="banner-container mb-2" 
    role="banner" 
    elevation="0" 
    :aria-label="bannerProps.ariaLabel" 
    flat>
    <div class="banner-content">
      <div class="banner-icon">
        <v-icon v-if="bannerProps.icon" :color="bannerProps.iconColor">{{ bannerProps.icon }}</v-icon>
      </div>
      <div class="banner-text">
        <span>{{ bannerProps.text }}</span>
        <span
          v-if="bannerProps.linkText && bannerProps.linkCommand"
          class="banner-link"
          @click="triggerCommand"
        >
          <a href="javascript:void(0)">{{ bannerProps.linkText }}</a>
        </span>
      </div>
    </div>
  </v-banner>
</template>

<script setup>
import { toRefs } from "vue";

const props = defineProps({
  bannerProps: {
    type: Object,
    required: true,
    default: () => ({
      icon: null,
      iconColor: "blue",
      text: "",
      linkText: "",
      linkCommand: "",
      role: "banner",
      ariaLabel: "Notification Banner"
    })
  },
  vscode: { 
    type: Object,
    required: true,
  },
});

const { bannerProps, vscode } = toRefs(props);

const triggerCommand = () => {
  if (bannerProps.value.linkCommand && vscode) {
    // Send the command to the backend
    vscode.value.postMessage({
      command: bannerProps.value.linkCommand
    });
  } else {
    console.warn("No linkCommand provided for YOUIBanner.");
  }
};
</script>

<style lang="scss">

.v-banner.banner-container {
  color: var(--vscode-foreground, #cccccc); 
  background-color: var(--vscode-sideBar-background, #2a2d2e); 
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-icon {
  display: flex;
  align-items: center;
  font-size: inherit;
}

.banner-text {
  white-space: pre-wrap;
  color: var(--vscode-foreground, #cccccc); 
  font-size: inherit;
}

.banner-link {
  color: var(--vscode-textLink-foreground, #3794ff); 
  text-decoration: underline; 
  cursor: pointer; 
  font-weight: bold; 
  width: fit-content; 

  &:hover {
    text-decoration: none;
    color: var(--vscode-textLink-activeForeground, #004999);
  }
}
</style>
