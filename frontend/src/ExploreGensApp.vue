<template>
  <v-app id="exploregens" class="exploregens-main explore-generators">
    <v-app-bar class="pa-0 elevation-0">
      <v-toolbar-title>{{messages.title}}</v-toolbar-title>
    </v-app-bar>

    <div v-if="ready">
    <v-expansion-panels v-if="isInTheia && isLegalNoteAccepted" flat>
      <v-expansion-panel class="explore-generators-panel">
        <v-expansion-panel-header disable-icon-rotate style="font-size:14px">
          {{messages.description}}
          <template v-slot:actions>
            <v-icon color="primary">$expand</v-icon>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-row>
            <v-icon class="ma-2" color="blue">mdi-information-outline</v-icon>
            <v-col class="pa-2">
              <v-card-title style="text-align:justify">{{messages.legal_note}}</v-card-title>
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-card-title v-else class="pa-2" style="font-size:14px">{{messages.description}}</v-card-title>

    <div v-if="isLegalNoteAccepted">
      <v-row>
        <v-col :cols="10">
          <v-text-field
            class="explore-generators-search-gens"
            :label="messages.search"
            v-model="query"
            outlined
            hide-details="auto"
            @input="onQueryChange"
            clearable
            @click:clear="onQueryChange"
          />
        </v-col>
        <v-col :cols="2">
          <v-select
            class="explore-generators-search-gens"
            hide-details="auto"
            outlined
            :items="items"
            v-model="recommended"
            :label="messages.recommended"
            @change="onQueryChange"
          />
        </v-col>
      </v-row>

      <v-row class="explore-generators-search pa-2">
        <v-card-title>{{searchResults}}</v-card-title>
        <v-icon v-if="refineSearch" color="blue">mdi-information-outline</v-icon>
        <v-card-title class="pa-0 ml-2" v-if="refineSearch">{{messages.refine_search}}</v-card-title>
      </v-row>

      <v-slide-x-transition>
        <v-row class="explore-generators-cards">
          <v-col
            v-for="(gen, i) in gens"
            :key="i"
            cols="12"
            md="4"
            sm="6"
            class="pb-2 d-flex flex-column"
          >
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
              <v-row class="ml-1">
                <v-card-title>{{gen.package.name}}</v-card-title>
                <v-col class="mt-1">
                  <v-card-title style="font-size:12px">{{gen.package.version}}</v-card-title>
                </v-col>
              </v-row>

              <v-card-text scrollable class="description">{{gen.package.description}}</v-card-text>
              <v-spacer></v-spacer>
              <v-card-text class="homepage">
                <a :href="gen.package.links.npm">{{messages.more_info}}</a>
              </v-card-text>
              <v-card-actions>
                <div class="pa-2">
                  <v-btn
                    min-width="140px"
                    raised
                    dark
                    elevation="5"
                    :disabled="gen.disabledToHandle"
                    :color="gen.color"
                    @click="onAction(gen)"
                  >{{gen.action}}</v-btn>
                </div>
                <v-spacer v-if="!gen.disabledToHandle"></v-spacer>
              </v-card-actions>
              <v-progress-linear
                v-if="gen.disabledToHandle"
                class="ma-0 pa-0"
                indeterminate
                color="primary"
              ></v-progress-linear>
            </v-card>
          </v-col>
        </v-row>
      </v-slide-x-transition>
    </div>
    <div v-else class="pa-2">
      <v-row class="pa-2">
        <v-icon class="ma-2" color="blue">mdi-information-outline</v-icon>
        <v-col class="pa-2">
          <v-text style="text-align:justify">{{messages.legal_note}}</v-text>
        </v-col>
      </v-row>
      <v-col class="ml-6">
        <v-btn @click="onAcceptLegalNote">{{messages.accept}}</v-btn>
      </v-col>
    </div>
    </div>
  </v-app>
</template>
<script>
const ALL_GENS = "All";

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
      isInTheia: false,
      isLegalNoteAccepted: true,
      ready: false
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
      return gen.installed ? "#585858" : "primary";
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
    async setIsLegalNoteAccepted() {
      this.isLegalNoteAccepted = await this.rpc.invoke("isLegalNoteAccepted");
    },
    async onAcceptLegalNote() {
      this.isLegalNoteAccepted = await this.rpc.invoke("acceptLegalNote");
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
      await this.setIsLegalNoteAccepted(),
      this.setIsInTheia()
    ]);
    await Promise.all([
      this.getRecommendedQuery(),
      this.getFilteredGenerators()
    ]);
    this.ready = true;
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
