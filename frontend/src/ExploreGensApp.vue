<template>
  <v-app id="exploregens" class="exploregens-main">
    <div class="explore-generators">
      <v-app-bar>
        <v-toolbar-title>{{messages.title}}</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-app-bar>
      <v-expansion-panels v-if="isInTheia" flat>
        <v-expansion-panel class="explore-generators-panel">
          <v-expansion-panel-header disable-icon-rotate>
            {{messages.description}}
            <template v-slot:actions>
              <v-icon color="primary">$expand</v-icon>
            </template>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-icon class="mr-3" color="blue">mdi-information-outline</v-icon>
              <v-col class="pa-2">
                <v-text>{{messages.legal_note}}</v-text>
              </v-col>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <v-row class="mt-3">
      <v-col :cols="10">
        <v-text-field
          class="explore-generators-search-gens ma-0 pa-0"
          :label="messages.search"
          v-model="query"
          hide-details="auto"
          @input="onQueryChange"
          rounded
          clearable
          @click:clear="onQueryChange"
        />
      </v-col>
      <v-col :cols="2">
        <v-select
          class="explore-generators-search-gens ma-0 pa-0"
          rounded
          hide-details="auto"
          :items="items"
          v-model="recommended"
          :label="messages.recommended"
          @change="onQueryChange"
        />
      </v-col>
    </v-row>

    <v-row class="explore-generators-search">
      <v-card-title>{{searchResults}}</v-card-title>
      <v-icon v-if="refineSearch" color="blue">mdi-information-outline</v-icon>
      <v-card-title class="pa-0" v-if="refineSearch">{{messages.refine_search}}</v-card-title>
    </v-row>

    <v-slide-x-transition>
      <v-row class="explore-generators-cards">
        <v-col
          v-for="(gen, i) in gens"
          :key="i"
          cols="12"
          md="4"
          sm="6"
          class="pa-3 d-flex flex-column"
        >
          <v-item>
            <v-card
              width="500"
              class="d-flex flex-column mx-auto"
              height="250"
              tile
              hover
              flat
              dark
              elevation="2"
            >
              <v-card-title>{{genDisplayName(gen)}}</v-card-title>
              <v-card-text scrollable class="description">{{gen.package.description}}</v-card-text>
              <v-card-text class="homepage">
                <a :href="gen.package.links.npm">{{messages.more_info}}</a>
              </v-card-text>
              <v-spacer></v-spacer>
              <v-card-actions>
                <div class="ma-2">
                  <v-btn
                    raised
                    elevation="5"
                    :disabled="gen.disabledToHandle"
                    :color="gen.color"
                    @click="onAction(gen)"
                  >{{gen.action}}</v-btn>
                  <v-progress-linear v-if="gen.disabledToHandle" indeterminate color="primary"></v-progress-linear>
                </div>
              </v-card-actions>
            </v-card>
          </v-item>
        </v-col>
      </v-row>
    </v-slide-x-transition>
  </v-app>
</template>

<script>
const ALL_GENS = "-----";

import * as _ from "lodash";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import messages from "./exploreGensMessages";

export default {
  name: "exploregens",
  data() {
    return {
      items: [],
      rpc: null,
      gens: [],
      total: 0,
      query: "",
      recommended: ALL_GENS,
      messages,
      isInTheia: false
    };
  },
  computed: {
    refineSearch() {
      const gensQuantity = _.size(this.gens);
      return !(this.total === gensQuantity);
    },
    searchResults() {
      const gensQuantity = _.size(this.gens);
      if (this.refineSearch) {
        return this.messages.results_out_of_total(gensQuantity, this.total);
      }

      return this.messages.results(this.total);
    },
    debouncedGenFilterChange() {
      return _.debounce(this.getFilteredGenerators, 200);
    }
  },
  methods: {
    genDisplayName(gen) {
      return `${gen.package.name} ${gen.package.version}`;
    },
    actionName(gen) {
      if (gen.disabledToHandle) {
        return gen.installed
          ? this.messages.uninstalling
          : this.messages.installing;
      }

      return gen.installed ? this.messages.uninstall : this.messages.install;
    },
    actionColor(gen) {
      return gen.installed ? "grey" : "primary";
    },
    async onAction(gen) {
      gen.disabledToHandle = true;
      gen.action = this.actionName(gen);
      const action = gen.installed ? "uninstall" : "install";
      gen.installed = await this.rpc.invoke(action, [gen]);

      const currentGen = _.find(this.gens, currentGen => {
        return gen.package.name === currentGen.package.name;
      });

      if (currentGen) {
        currentGen.disabledToHandle = false;
        currentGen.installed = gen.installed;
        currentGen.action = this.actionName(currentGen);
        currentGen.color = this.actionColor(currentGen);
      }
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
      this.gens = _.map(res[0], gen => {
        gen.action = this.actionName(gen);
        gen.color = this.actionColor(gen);
        return gen;
      });
      this.total = res[1];
    },
    async getRecommendedQuery() {
      this.items = await this.rpc.invoke("getRecommendedQuery");
      this.items.unshift(ALL_GENS);
    },
    async setIsInTheia() {
      this.isInTheia = await this.rpc.invoke("isInTheia");
    },
    async updateBeingHandledGenerator(genName, isBeingHandled) {
      const gen = _.find(this.gens, gen => {
        return gen.package.name === genName;
      });

      if (gen) {
        gen.disabledToHandle = isBeingHandled;
      }
    },
    getVscodeApi() {
      if (this.isInVsCode()) {
        if (!window.vscode) {
          // eslint-disable-next-line no-undef
          window.vscode = acquireVsCodeApi();
        }
        return window.vscode;
      }
    },
    initRpc(rpc) {
      this.rpc = rpc;
      rpc.registerMethod({
        func: this.updateBeingHandledGenerator,
        thisArg: this,
        name: this.updateBeingHandledGenerator.name
      });
    },
    async setupRpc() {
      const vscodeApi = this.getVscodeApi();
      if (vscodeApi) {
        this.initRpc(new RpcBrowser(window, vscodeApi));
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8082");
        const that = this;
        return new Promise(resolve => {
          ws.onopen = () => {
            that.initRpc(new RpcBrowserWebSockets(ws));
            resolve();
          };
        });
      }
    }
  },
  async created() {
    await this.setupRpc();
    await Promise.all([
      this.getRecommendedQuery(),
      this.getFilteredGenerators(),
      this.setIsInTheia()
    ]);
  }
};
</script>
<style scoped>
.exploregens-main {
  margin: 0px 5px 5px;
}
.explore-generators .theme--light.v-expansion-panels .v-expansion-panel,
.explore-generators-cards .v-card {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.explore-generators .v-app-bar.v-toolbar,
.explore-generators .v-app-bar.v-toolbar .v-btn {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
}
.explore-generators .v-app-bar.v-toolbar {
  border-bottom: 1px solid var(--vscode-editorWidget-background, #252526);
  box-shadow: none;
  background-color: var(--vscode-editor-background, #1e1e1e) !important;
}
.explore-generators-cards .v-card:hover {
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
}
.explore-generators-cards .v-card.selected {
  border: 1px solid var(--vscode-button-background, #0e639c);
  background-color: var(--vscode-list-hoverBackground, #2a2d2e);
}
.explore-generators .theme--light.v-expansion-panels .v-expansion-panel,
.explore-generators-cards
  .theme--light.v-card
  .v-card__subtitle.v-card__subtitle,
.explore-generators-cards .v-icon.v-icon,
.explore-generators-cards .v-card > div.v-card__text {
  color: var(--vscode-editorCodeLens-foreground, #999999);
}
.explore-generators-cards {
  overflow-y: auto;
  margin: 0px;
  height: calc(100% - 4rem);
}

.v-card__title {
  word-wrap: break-word;
  word-break: normal;
}
.description.v-card__text {
  text-overflow: ellipsis;
  overflow: hidden;
}
.homepage.v-card__text {
  padding-bottom: 0;
}
a {
  font-size: 11px;
}
.explore-generators-panel {
  background-color: var(--vscode-editor-background, #1e1e1e) !important;
  box-shadow: none;
  text-align: justify;
}

.explore-generators-search-gens {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.explore-generators-search .v-card__title {
  font-size: 14px;
}
</style>
