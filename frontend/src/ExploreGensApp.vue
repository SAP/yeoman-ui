<template>
  <v-app id="exploregens">
    <v-container class="explore-generators">
      <PromptInfo :currentPrompt="headerInfo" />
      <div>
        <v-row class="prompts-col">
          <v-col :cols="10">
            <v-text-field label="Search for Generators" v-model="query" @input="onQueryChange" />
          </v-col>
          <v-col :cols="2">
            <v-select
              :items="items"
              v-model="recommended"
              label="Recommended"
              @change="onQueryChange"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-label>{{searchResults}}</v-text-label>
          </v-col>
        </v-row>
        <v-row>
          <v-col md="3" class="pa-3 d-flex flex-column" v-for="(gen, i) in gens" :key="i">
            <v-card width="300" class="d-flex flex-column mx-auto" height="300" tile elevation="2">
              <v-card-title primary-title>
                <h3 class="headline mb-0">{{ gen.package.name }}</h3>
              </v-card-title>
              <v-card-text style="overflow-y: auto; height:200px" v-text="gen.package.description" />
              <v-card-subtitle v-text="gen.package.version" />
              <v-card-text class="homepage">
                <a :href="gen.package.links.npm">More information\</a>
              </v-card-text>
              <v-card-actions>
                <v-menu bottom left>
                  <template v-slot:activator="{on}">
                    <v-btn icon v-on="on" :loading="gen.disabledToHandle" @click="getActions(gen)">
                      <v-icon>mdi-cog-outline</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(item, i) in genActions"
                      :key="i"
                      @click="onAction(gen, item)"
                    >
                      <v-list-item-title>{{ item }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-container>
  </v-app>
</template>

<script>
const ALL_GENS = "-----";

import * as _ from "lodash";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import PromptInfo from "./components/PromptInfo.vue";

export default {
  name: "exploregens",
  components: {
    PromptInfo
  },
  data() {
    return {
      items: [],
      genActions: [],
      rpc: Object,
      gens: [],
      total: 0,
      readonly: true,
      query: "",
      recommended: ALL_GENS,
      headerInfo: {
        name: "Explore Generators",
        description:
          "This view enables the exploration and installation of external open source Yeoman generators."
      }
    };
  },
  computed: {
    searchResults() {
      const gensQuantity = _.size(this.gens);
      if (this.total === gensQuantity) {
        return `Showing ${this.total} results`;
      }

      return `Showing ${gensQuantity} out of ${this.total} results. You may refine your search`;
    },
    debouncedGenFilterChange() {
      return _.debounce(this.getFilteredGenerators, 200);
    }
  },
  methods: {
    async getActions(gen) {
      if (!gen.disabledToHandle) {
        this.genActions = [];
        gen.disabledToHandle = true;
        const isInstalled = await this.rpc.invoke("isInstalled", [gen]);
        this.genActions = isInstalled === true ? [`Uninstall`] : [`Install`];
        gen.disabledToHandle = false;
      }
    },
    async onAction(gen, actionName) {
      gen.disabledToHandle = true;
      await this.rpc.invoke(_.lowerCase(actionName), [gen]);
      gen.disabledToHandle = false;
    },
    onQueryChange() {
      this.debouncedGenFilterChange();
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    async getFilteredGenerators() {
      const recommended = this.recommended === ALL_GENS ? "" : this.recommended;
      const res = await this.rpc.invoke("getFilteredGenerators", [
        this.query,
        recommended
      ]);
      this.gens = res[0];
      this.total = res[1];
    },
    async getRecommendedQuery() {
      this.items = await this.rpc.invoke("getRecommendedQuery");
      this.items.unshift(ALL_GENS);
    },
    setVscodeApiOnWindow() {
      if (this.isInVsCode() && !window.vscode) {
        // eslint-disable-next-line
        window.vscode = acquireVsCodeApi();
      }
    },
    async updateBeingHandledGenerator(genName, isBeingHandled) {
      const gen = _.find(this.gens, gen => {
        return gen.package.name === genName;
      });

      if (gen) {
        gen.disabledToHandle = isBeingHandled;
      }
    },
    setupRpc() {
      /* istanbul ignore if */
      if (this.isInVsCode()) {
        this.setVscodeApiOnWindow();
        this.rpc = new RpcBrowser(window, window.vscode);

        this.rpc.registerMethod({
          func: this["updateBeingHandledGenerator"],
          thisArg: this,
          name: "updateBeingHandledGenerator"
        });
      }
    }
  },
  async created() {
    this.setupRpc();
    await this.getFilteredGenerators();
    await this.getRecommendedQuery();
  }
};
</script>
<style scoped>
.explore-generators .v-card {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.explore-generators .v-card:hover {
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
}
.explore-generators .v-card.selected {
  border: 1px solid var(--vscode-button-background, #0e639c);
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
}
.explore-generators .theme--light.v-card .v-card__subtitle.v-card__subtitle,
.explore-generators .v-icon.v-icon,
.explore-generators .v-card__title {
  color: var(--vscode-foreground, #cccccc);
}
.explore-generators .v-card > div.v-card__text {
  color: var(--vscode-editorCodeLens-foreground, #999999);
}
</style>
