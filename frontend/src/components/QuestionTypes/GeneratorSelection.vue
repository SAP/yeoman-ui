<template>
  <div>
    <v-item-group mandatory>
      <v-container class="pa-0">
        <v-row>
          <v-col
            v-for="(item, itemIndex) in currentQuestion.choices"
            :key="itemIndex"
            cols="12"
            md="4"
            sm="6"
          
          >
            <v-item v-slot:default="{ active, toggle }">
              <v-card
                width="400"
                class="d-flex flex-column mx-auto"
                @click="emitSelection(item.name)"
                v-on:click="select"
                height="380"
                tile
                hover
                flat
                dark
               raised
              >
                <v-card-title>{{item.prettyName}}</v-card-title>
                <v-card-text>
                  {{item.message}}
                  <br />
                  <a :href="item.homepage">Generator Documentation</a>
                </v-card-text>
                <v-spacer></v-spacer>
                <v-card-actions>
                  <v-img class :src="getImageUrl(item)" height="194"></v-img>
                </v-card-actions>
              </v-card>
            </v-item>
          </v-col>
        </v-row>
      </v-container>
    </v-item-group>
  </div>
</template>

<script>
import _ from "lodash";

export default {
  name: "GeneratorSelection",
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
      selectedItem: undefined,
      nColumns: 1, // number of groups/columns
      groupedItems: []
    };
  },
  methods: {
    getImageUrl(choice) {
      return _.get(choice, "imageUrl", `${this.publicPath}generator.png`);
    },
    select(event) {
      if (this.selectedItem) {
        // deselect old selection
        this.selectedItem.classList.toggle("selected");
        this.selectedItem.setAttribute("border-style", "none");
      }
      this.selectedItem = event.currentTarget;
      this.selectedItem.setAttribute("border-style", "solid");
      this.selectedItem.classList.toggle("selected");
    },
    emitSelection(generatorName) {
      this.currentQuestion.answer = generatorName;
      this.$emit("generatorSelected", generatorName);
    }
  }
};
</script>

<style scoped>
.v-card {
  background-color: var(--vscode-input-background, #3c3c3c);
}
.v-card:hover {
  background-color: var(--vscode-list-hoverBackground,#2a2d2e) !important;
}
.v-card.selected {
  border: 1px solid var(--vscode-button-background, #0e639c);
  background-color: var(--vscode-list-hoverBackground,#2a2d2e) ;
}
.v-card__title {
  color: var(--vscode-foreground, #cccccc);
}
.v-card > div.v-card__text {
  color: var(--vscode-editorCodeLens-foreground, #999999);
}
a {
  font-size: 11px;
}
</style>
