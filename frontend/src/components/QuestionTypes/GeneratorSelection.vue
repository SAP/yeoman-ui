<template>
  <div>
    <b-card-group deck>
      <b-container fluid>
        <b-row v-for="(chunk, chunkIndex) in getChunks()" :key="chunkIndex">
          <b-col v-for="(item, itemIndex) in chunk" :key="itemIndex" col=true class="col-generator">
            <b-card
              @click="emitSelection(item.name)"
              v-on:click="select"
              class="generator"
              :title="item.name"
              img-alt="Image"
              img-top
              tag="article"
            >
              <b-card-text>{{item.message}}</b-card-text>
              <b-card-text class="templateDocumentationClass">Template Documentation</b-card-text>
              <b-card-img :src="getImageUrl(item)"></b-card-img>
            </b-card>
          </b-col>
        </b-row>
      </b-container>
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
      selectedItem: undefined,
      nColumns: 3, // number of groups/columns
      groupedItems: []
    }
  },
  methods: {
    getImageUrl(choice) {
      return _.get(choice, "imageUrl", `${this.publicPath}generator.png`)
    },
    select(event) {
      if (this.selectedItem) {
        // deselect old selection
        this.selectedItem.classList.toggle("selected")
        this.selectedItem.setAttribute("border-style", "none")
      }
      this.selectedItem = event.currentTarget
      this.selectedItem.setAttribute("border-style", "solid")
      this.selectedItem.classList.toggle("selected")
    },
    emitSelection(generatorName) {
      this.currentQuestion.answer = generatorName
      this.$emit("generatorSelected", generatorName)
    },
    chunk: function(arr, size) {
      var newArr = [];
      for (var i=0; i<arr.length; i+=size) {
        newArr.push(arr.slice(i, i+size));
      }
      return newArr;
    },
    getChunks: function() {
      // divide into n groups
      return this.chunk(this.currentQuestion.choices, this.nColumns); 
    }
  },
}

</script>

<style>
.col.col-generator {
  padding: 11px;
}

.card-body {
  color: var(--vscode-editorWidget-foreground, #cccccc);
  border: none;
}

.card-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--vscode-editor-foreground, #d4d4d4);
}

.card-text {
  font-size: 0.75rem;
  color: var(--vscode-editorCodeLens-foreground, #999999)
}

.card-text.templateDocumentationClass {
  /* change this to vscode color for url */
  color: var(--vscode-textLink-foreground, #3794ff);
}

.card-deck {
  margin: 0rem;
}

.card.generator {
  width: 100%;
  height: 100%;
  max-width: 500px;
  max-height: 500px;
  border-style: none;
  border-width: 1px;
  border-radius: 0px;
  border-color: var(--vscode-button-background, #0e639c);
  background-color: var(--vscode-input-background, #3c3c3c);
}

.card.generator:hover:not(.selected) {
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
  cursor: pointer;
}

.card.generator.selected {
  border-style: solid;
  background-color: var(--vscode-menu-background, #3c3c3c);
}
</style>
