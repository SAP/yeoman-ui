<template>
  <div>
    <b-navbar>
      <b-navbar-brand>Generator: {{generatorName}}</b-navbar-brand>

      <b-navbar-nav>
        <b-nav-text>Step: {{ currentPrompt }}/{{ numOfSteps }}</b-nav-text>
        <b-nav-text>{{ stepName }}</b-nav-text>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-form>
          <b-button v-b-toggle.showLogId @click="collapseLog">▤</b-button>
        </b-nav-form>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: "Header",
  props: ["generatorName", "currentPrompt", "numOfSteps", "stepName", "rpc"],
  methods: {
    collapseLog() {
      this.rpc.invoke("toggleLog", [{}])
    }
  }
};
</script>
<style>
.navbar-brand {
  color: var(--vscode-editorSuggestWidget-foreground, #d4d4d4) !important;
}
.navbar-text {
  color: var(--vscode-editorCodeLens-foreground, #999999) !important;
}
</style>
