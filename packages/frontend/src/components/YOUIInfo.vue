<template>
  <div id="info-component">
    <v-row style="height: 100%">
      <v-col align-self="center" class="info-column" cols="10">
        <v-card-subtitle class="info-message prompt-title">
          <v-icon :color="color">
            {{ icon }}
          </v-icon>
          {{ infoMessage }}
        </v-card-subtitle>
      </v-col>
    </v-row>
  </div>
</template>
<script setup>
import { ref, toRefs } from "vue";

const props = defineProps({
  infoMessage: {
    type: String,
    default: "",
  },
  infoUrl: {
    type: String,
    default: "",
  },
});

const { infoMessage } = toRefs(props);

const color = ref("blue");
const icon = ref("mdi-information-outline");
</script>

<style>
.info-message.v-card-subtitle {
  color: var(--vscode-editorCodeLens-foreground, #999999);
  white-space: pre-wrap;
}
</style>
