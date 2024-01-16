<template>
  <div id="done-component">
    <v-row align="center" justify="center" style="height: 100%">
      <v-col align-self="center" class="done-column" cols="10">
        <p class="done-message">
          <v-icon :color="color" size="30">
            {{ icon }}
          </v-icon>
          {{ doneMessage }}
        </p>
      </v-col>
    </v-row>
  </div>
</template>
<script setup>
import { computed, toRefs, unref } from "vue";

const props = defineProps({
  doneStatus: {
    type: Boolean,
  },
  doneMessage: {
    type: String,
    default: "",
  },
  donePath: {
    type: String,
    default: undefined,
  },
});

const { doneMessage, donePath, doneStatus } = toRefs(props);

const color = computed(() => {
  return unref(doneStatus) ? (unref(donePath) !== "" ? "success" : "indigo") : "red";
});

const icon = computed(() => {
  return unref(doneStatus)
    ? unref(donePath) !== ""
      ? "mdi-checkbox-marked-circle-outline"
      : "mdi-wrench-outline"
    : "mdi-close-circle-outline";
});
</script>

<style>
.done-message {
  font-size: 1.25rem;
  white-space: pre-wrap;
}
.done-column {
  background-color: var(--vscode-editorWidget-background, #252526);
}
</style>
