<template>
  <div>
    <b-card-group deck>
      <b-card
        v-for="(choice, index) in currentQuestion.choices"
        @click="emitSelection(choice.name)"
        v-on:click="select"
        class="generator"
        :key="index"
        :title="choice.name"
        img-alt="Image"
        img-top
        tag="article"
        style="width: 15rem"
      >
        <b-card-text>{{choice.message}}</b-card-text>
        <b-card-text class="templateDocumentationClass">Template Documentation</b-card-text>

        <b-card-img :src="getImageUrl(choice)"></b-card-img>
      </b-card>
    </b-card-group>
  </div>
</template>

<script>
import _ from "lodash"

export default {
  name: "GeneratorSelection",
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
      selectedItem: undefined
    }
  },
  methods: {
    getImageUrl(choice) {
      return _.get(choice, "imageUrl", `${this.publicPath}generator.png`)
    },
    select(event) {
      if (this.selectedItem) {
        // deselect old selection
        this.selectedItem.setAttribute("border-style", "none")
      }
      this.selectedItem = event.currentTarget
      this.selectedItem.setAttribute("border-style", "solid")
      this.selectedItem.classList.toggle("selected")
    },
    emitSelection(generatorName) {
      this.currentQuestion.answer = generatorName
      this.$emit("generatorSelected", generatorName)
    }
  }
}
</script>

<style>
.card-body {
  color: var(--vscode-foreground, #cccccc);
  border: none;
}

.card-title {
  font-size: 1rem;
  font-weight: bold;
}

.card-text {
  font-size: 0.75rem;
}

.card-text.templateDocumentationClass {
  /* change this to vscode color for url */
  color: var(--vscode-textLink-foreground, #3794ff);
}

.card.generator {
  border-style: none;
  border-width: 1px;
  border-radius: 0px;
  border-color: var(--vscode-list-activeSelectionForeground, white);
  background-color: var(--vscode-notifications-border, #1e1e1e);
}

.card.generator:hover:not(.selected) {
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
  cursor: pointer;
}

.card.generator.selected {
  border-style: solid;
}
</style>
