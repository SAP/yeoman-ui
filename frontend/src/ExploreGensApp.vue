<template>
  <v-app id="exploregens">
    <v-container>
      <v-row>
        <v-text-label>Explore Generators</v-text-label>
      </v-row>
      <v-row>
        <v-text-label>This view enables the exploration and installation of external open source Yeoman generators.</v-text-label>
      </v-row>

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
        <v-col >
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
            <v-card-text class="homepage">
              <a :href="gen.package.links.npm">More Information</a>
            </v-card-text>
            <v-card-actions>
              <v-menu bottom left>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    :loading="gen.disabledToHandle"
                    @click="getActions(gen)"
                  >
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
              <v-card-subtitle v-text="gen.package.version" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
const ALL_GENS = "-----";

import * as _ from "lodash";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
export default {
  name: "exploregens",
  data() {
    return {
      items: [],
      genActions: [],
      rpc: Object,
      gens: [],
      total: 0,
      readonly: true,
      query: "",
      recommended: ALL_GENS
    };
  },
  computed: {
    searchResults() {
      const gensQuantity = _.size(this.gens);
      if (this.total === gensQuantity) {
        return `Showing ${this.total} results`;
      }

      return `Showing ${gensQuantity} out of  ${this.total} results`;
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
@import "./../node_modules/vue-loading-overlay/dist/vue-loading.css";
.consoleClassVisible {
  visibility: visible;
}
.consoleClassHidden {
  visibility: hidden;
}
div.consoleClassVisible .v-footer {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
}
#logArea {
  font-family: monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}
.left-col {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.prompts-col {
  overflow-y: auto;
  margin: 0px;
}
.main-row,
.prompts-col {
  height: calc(100% - 4rem);
}
.left-col,
.right-col,
.right-row,
#step-component-div,
#QuestionTypeSelector,
#QuestionTypeSelector > .col,
#QuestionTypeSelector > .col > div {
  height: 100%;
}
.right-col {
  padding: 0 !important;
}
.diagonal {
  width: 80px;
  background: linear-gradient(
    120deg,
    var(--vscode-editor-background, #1e1e1e) 0%,
    var(--vscode-editor-background, #1e1e1e) 50%,
    transparent 50%
  );
  background-color: var(--vscode-editorWidget-background, #252526);
}
.bottom-right-col {
  background: var(--vscode-editor-background, #1e1e1e);
  overflow: hidden;
  margin: 0px;
}
.bottom-buttons-col {
  background-color: var(--vscode-editorWidget-background, #252526);
  padding-right: 25px;
}
.bottom-buttons-col > .v-btn:not(:last-child) {
  margin-right: 10px !important;
}
</style>
