<template>
  <div id="info-component">
    <v-row style="height: 100%">
      <v-col align-self="center" class="info-column" cols="10">
        <v-card-subtitle class="info-message prompt-title">
          <v-icon :color="color">{{ icon }}</v-icon> {{ infoMessage }}
        </v-card-subtitle>
      </v-col>
    </v-row>
  </div>
</template>
<script>
export default {
  name: "Info",
  props: ["infoMessage", "infoUrl"],
  computed: {
    color() {
      return "blue";
    },
    icon() {
      return "mdi-information-outline";
    },
  },
};
</script>

<style>
.info-message.v-card__subtitle {
  color: var(--vscode-editorCodeLens-foreground, #999999);
  white-space: pre-wrap;
}
</style>
