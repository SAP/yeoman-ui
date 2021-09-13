<template>
  <v-app id="exploregens" class="exploregens-main explore-generators">
    <div>
      <v-app-bar id="app-bar" dense class="pa-0 ma-0 elevation-0">
        <v-toolbar-title>{{ messages.title }}</v-toolbar-title>
      </v-app-bar>
    </div>
    <v-card-text class="pa-2" style="font-size: 14px">{{ messages.description }}</v-card-text>
    <v-expansion-panels v-if="isInBAS && isLegalNoteAccepted && ready" flat class="explore-generators">
      <v-expansion-panel @click="onDisclaimer">
        <v-expansion-panel-header class="homepage pa-2"
          ><a style="text-decoration: underline">{{ disclaimer }}</a></v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <v-row>
            <v-col>
              <v-card-text class="pa-0 ma-0" style="font-size: 14px">{{ messages.legal_note }}</v-card-text>
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-row v-if="isLegalNoteAccepted && ready">
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

    <v-row class="explore-generators-search pa-2" v-if="isLegalNoteAccepted && ready">
      <v-card-title>{{ searchResults }}</v-card-title>
      <v-icon v-if="refineSearch" color="blue">mdi-information-outline</v-icon>
      <v-card-title class="pa-0 ml-2" v-if="refineSearch">{{ messages.refine_search }}</v-card-title>
    </v-row>

    <v-slide-x-transition v-if="isLegalNoteAccepted && ready">
      <v-row class="explore-generators-cards">
        <v-col v-for="(gen, i) in gens" :key="i" cols="12" md="4" sm="6" class="pb-2 d-flex flex-column">
          <v-card width="500" class="d-flex flex-column mx-auto" height="260" tile hover flat dark elevation="2">
            <v-card-title>{{ gen.package.name }}</v-card-title>
            <v-card-subtitle>{{ gen.package.version }}</v-card-subtitle>
            <v-card-text min-height="70" style="overflow-y: auto">{{ gen.package.description }}</v-card-text>
            <v-spacer></v-spacer>
            <v-card-text class="homepage">
              <a :href="gen.package.links.npm">{{ messages.more_info }}</a>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-btn min-width="130px" :text="gen.disabledToHandle" :color="gen.color" @click="onAction(gen)">{{
                gen.action
              }}</v-btn>
            </v-card-actions>
            <v-progress-linear v-if="gen.disabledToHandle" indeterminate color="primary"></v-progress-linear>
          </v-card>
        </v-col>
      </v-row>
    </v-slide-x-transition>
    <div v-if="!isLegalNoteAccepted && ready">
      <v-row class="pa-2">
        <v-col>
          <v-card-text id="legal-note" class="pa-0 ma-0" style="font-size: 14px">{{ messages.legal_note }}</v-card-text>
          <v-btn class="mt-6" @click="onAcceptLegalNote">{{ messages.accept }}</v-btn>
        </v-col>
      </v-row>
    </div>
  </v-app>
</template>
<script>
const ALL_GENS = "All";

import _size from "lodash/size";
import _get from "lodash/get";
import _debounce from "lodash/debounce";
import _map from "lodash/map";
import _find from "lodash/find";
import _includes from "lodash/includes";
import _forEach from "lodash/forEach";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import messages from "./messages";
import utils from "../utils";

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
      isInBAS: false,
      isLegalNoteAccepted: true,
      ready: false,
      disclaimerOpened: false,
    };
  },
  computed: {
    disclaimer() {
      return this.disclaimerOpened ? this.messages.hide_disclaimer : this.messages.view_disclaimer;
    },
    refineSearch() {
      const gensQuantity = _size(this.gens);
      return !(this.total === gensQuantity);
    },
    searchResults() {
      const gensQuantity = _size(this.gens);
      if (this.refineSearch) {
        return this.messages.results_out_of_total(gensQuantity, this.total);
      }

      return this.messages.results(this.total);
    },
  },
  methods: {
    onDisclaimer() {
      this.disclaimerOpened = !this.disclaimerOpened;
    },
    actionName(gen) {
      if (gen.state === "outdated") {
        return messages.update;
      } else if (gen.state === "installed") {
        return messages.uninstall;
      } else if (gen.state === "notInstalled") {
        return messages.install;
      } else {
        // installing, uninstalling, updating
        return messages[gen.state];
      }
    },
    actionColor(gen) {
      if (gen.disabledToHandle) {
        return "primary";
      }

      return gen.state === "installed" ? "#585858" : "primary";
    },
    onAction(gen) {
      const action = gen.action.toLowerCase();
      this.rpc.invoke(action, [gen]);
    },
    onQueryChange() {
      const debouncer = _debounce(this.getFilteredGenerators, 200);
      debouncer();
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    async getFilteredGenerators() {
      const recommended = this.recommended === ALL_GENS ? "" : this.recommended;
      const packagesData = await this.rpc.invoke("getFilteredGenerators", [_get(this, "query", ""), recommended]);
      this.gens = _map(packagesData.packages, (gen) => {
        gen.action = this.actionName(gen);
        gen.color = this.actionColor(gen);
        return gen;
      });
      this.total = packagesData.total;
    },
    async getRecommendedQuery() {
      this.items = await this.rpc.invoke("getRecommendedQuery");
      this.items.unshift(ALL_GENS);
    },
    async setIsInBAS() {
      this.isInBAS = await this.rpc.invoke("getIsInBAS");
    },
    async setIsLegalNoteAccepted() {
      this.isLegalNoteAccepted = await this.rpc.invoke("isLegalNoteAccepted");
    },
    async onAcceptLegalNote() {
      this.isLegalNoteAccepted = await this.rpc.invoke("acceptLegalNote");
    },
    setGenQuery(genFullName) {
      this.query = genFullName;
      this.onQueryChange();
    },
    async updateBeingHandledGenerator(genName, genState) {
      const gen = _find(this.gens, (gen) => {
        return gen.package.name === genName;
      });

      if (gen) {
        gen.disabledToHandle = _includes(["uninstalling", "installing", "updating"], genState);
        gen.state = genState;
        gen.action = this.actionName(gen);
        gen.color = this.actionColor(gen);
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
      const functions = ["updateBeingHandledGenerator", "setGenQuery"];
      _forEach(functions, (funcName) => {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName,
        });
      });
    },
    async setupRpc() {
      const vscodeApi = this.getVscodeApi();
      if (vscodeApi) {
        this.initRpc(new RpcBrowser(window, vscodeApi));
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8082");
        const that = this;
        return new Promise((resolve) => {
          ws.onopen = () => {
            that.initRpc(new RpcBrowserWebSockets(ws));
            resolve();
          };
        });
      }
    },
  },
  async created() {
    await this.setupRpc();
    await Promise.all([await this.setIsLegalNoteAccepted(), await this.setIsInBAS()]);
    await Promise.all([this.getRecommendedQuery(), this.getFilteredGenerators()]);
    this.ready = true;
  },
  mounted() {
    // TODO: remove after a solution is found for DEVXBUGS-8741
    utils.addAndRemoveClass("legal-note", "material-icons");
  },
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
.homepage.v-card__text {
  padding-bottom: 0;
}
a {
  font-size: 11px;
}
.explore-generators-search-gens {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.explore-generators-search .v-card__title {
  font-size: 14px;
}
.explore-generators-cards .v-card__subtitle {
  color: var(--vscode-foreground, #cccccc) !important;
}
</style>
