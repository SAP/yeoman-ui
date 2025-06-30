<template>
  <!-- Banner container -->
  <v-banner 
    class="banner-container mb-6 mt-2" 
    role="banner" 
    elevation="0" 
    :aria-label="bannerProps.ariaLabel" 
    flat
    @click="bannerProps.triggerActionFrom === 'banner' ? triggerCommand(bannerProps.action?.command) : null">
    
    <!-- Banner content -->
    <div class="banner-content">
      
      <!-- Banner icon -->
      <div class="banner-icon">
        <!-- Render image if icon type is "image" -->
        <img 
          v-if="bannerProps.icon?.type === 'image'" 
          :src="bannerProps.icon?.source" 
          :alt="bannerProps.ariaLabel" 
        />
        <!-- Render v-icon if icon type is "mdi" -->
        <v-icon v-else-if="bannerProps.icon?.type === 'mdi'">
          {{ bannerProps.icon?.source }}
        </v-icon>
      </div>
      
      <!-- Banner text -->
      <div class="banner-text">
        <span>{{ bannerProps.text }}</span>
        
        <!-- Render action text if triggerActionFrom is "banner" -->
        <span
          v-if="bannerProps.triggerActionFrom === 'banner' && bannerProps.action?.text"
          class="banner-link-text">
          {{ bannerProps.action?.text }}
        </span>
        
        <!-- Render clickable action text if triggerActionFrom is "link" -->
        <span
          v-if="bannerProps.triggerActionFrom === 'link' && bannerProps.action?.text"
          class="banner-link-text banner-link">
          <a 
            href="javascript:void(0)" 
            @click="triggerCommand(bannerProps.action?.command)">
            {{ bannerProps.action?.text }}
          </a>
        </span>
        
        <!-- Render clickable URL if triggerActionFrom is "link" -->
        <span
          v-if="bannerProps.triggerActionFrom === 'link' && bannerProps.action?.url"
          class="banner-link-text banner-link">
          <a 
            :href="bannerProps.action?.url" 
            target="_blank">
            {{ bannerProps.linkText }}
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
      stepName: "",
      text: "",
      ariaLabel: "Banner",
      icon: {},
      action: {},
      triggerActionFrom: "banner", 
      linkText: "",
    })
  }
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

$icon-background-color: #005FB8;
$background-color: var(--vscode-sideBar-background, #2a2d2e);
$focus-border-color: var(--vscode-focusBorder, $icon-background-color);
$text-link-color: var(--vscode-textLink-foreground, $icon-background-color);
$text-link-hover-color: var(--vscode-textLink-activeForeground, #004999);


.v-banner.banner-container {
  background-color: $background-color; 
  border-radius: 3px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1) !important;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid transparent; 
  cursor: pointer;
  height: 48px;
}

.v-banner.banner-container:hover {
  border: 1px solid $focus-border-color; 
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.banner-icon {
  display: flex;
  align-items: center;
  font-size: inherit;
  background-color: $icon-background-color;
  border-radius: 2px;
  padding: 4px;
}

.banner-text {
  white-space: pre-wrap;
  color: var(--vscode-editor-foreground, #cccccc); 
  font-size: 13px;
}

.banner-link-text {
  color: $text-link-color; 
  text-decoration: underline; 
  font-weight: bold; 
  width: fit-content; 
}

.banner-link {
  cursor: pointer; 
  &:hover {
    text-decoration: none;
    color: $text-link-hover-color;
  }
}
</style>
