<template>
  <v-app id="exploregens" class="exploregens-main">
    <div class="explore-generators">
      <v-card-title class="explore-generators-title">{{messages.title}}</v-card-title>
      <v-expansion-panels class="explore-generators-description" flat>
        <v-expansion-panel>
          <v-expansion-panel-header disable-icon-rotate>
            {{messages.description}}
            <template v-slot:actions>
              <v-icon color="primary">$expand</v-icon>
            </template>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-container fluid>
              <!-- <v-col :cols="1"> -->
                <!-- <v-icon color="blue">mdi-information-outline</v-icon> -->
              <!-- </v-col> -->
              <!-- <v-col :cols="11"> -->
                <v-text-field prepend-icon="mdi-information-outline">{{messages.legal_note}}</v-text-field>
                <!-- <v-card-title >{{messages.legal_note}}</v-card-title> -->
              <!-- </v-col> -->
            </v-container>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <v-row class="prompts-col">
      <v-col :cols="10">
        <v-text-field
          :label="messages.search"
          v-model="query"
          @input="onQueryChange"
          rounded
          clearable
          @click:clear="onQueryChange"
          background-color="var(--vscode-input-background, #3c3c3c)"
        />
      </v-col>
      <v-col :cols="2">
        <v-select
          rounded
          background-color="var(--vscode-input-background, #3c3c3c)"
          :items="items"
          v-model="recommended"
          :label="messages.recommended"
          @change="onQueryChange"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-card-title>{{searchResults}}</v-card-title>
      <v-icon v-if="refineSearch" color="blue">mdi-information-outline</v-icon>
      <v-card-title v-if="refineSearch">{{messages.refine_search}}</v-card-title>
    </v-row>

    <v-slide-x-transition>
      <v-row class="explore-generators-cards">
        <v-col md="4" class="pa-3 d-flex flex-column" v-for="(gen, i) in gens" :key="i">
          <v-card width="430" class="d-flex flex-column mx-auto" height="280" tile elevation="2">
            <v-card-title primary-title>
              <h3 class="headline mb-0">{{ gen.package.name }}</h3>
            </v-card-title>
            <v-card-text style="overflow-y: auto; height:200px" v-text="gen.package.description" />
            <v-card-subtitle v-text="gen.package.version" />
            <v-card-text class="homepage">
              <a :href="gen.package.links.npm">{{messages.more_info}}</a>
            </v-card-text>
            <v-card-actions>
              <v-btn
                class="explore-generators-loading"
                :loading="isLoading(gen)"
                :color="gen.actionColor"
                @click="onAction(gen)"
              >{{gen.action}}</v-btn>
            </v-card-actions>
          </v-card>
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
      messages
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
    isLoading(gen) {
      return gen.disabledToHandle;
    },
    actionName(gen) {
      return gen.installed ? this.messages.uninstall : this.messages.install;
    },
    actionColor(gen) {
      return gen.installed ? "grey" : "primary";
    },
    async onAction(gen) {
      if (!gen.disabledToHandle) {
        gen.disabledToHandle = true;
        gen.installed = await this.rpc.invoke(_.lowerCase(gen.action), [gen]);

        const currentGen = _.find(this.gens, currentGen => {
          return gen.package.name === currentGen.package.name;
        });

        if (currentGen) {
          currentGen.action = this.actionName(gen);
          currentGen.disabledToHandle = false;
          currentGen.actionColor = this.actionColor(gen);
        }
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
        gen.actionColor = this.actionColor(gen);
        return gen;
      });
      this.total = res[1];
    },
    async getRecommendedQuery() {
      this.items = await this.rpc.invoke("getRecommendedQuery");
      this.items.unshift(ALL_GENS);
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
      this.getFilteredGenerators()
    ]);
  }
};
</script>
<style scoped>
.exploregens-main {
  margin: 20px;
}
.explore-generators .theme--light.v-expansion-panels .v-expansion-panel,
.explore-generators-cards .v-card {
  background-color: var(--vscode-editorWidget-background, #252526);
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
.explore-generators-cards .v-card__title {
  color: var(--vscode-foreground, #cccccc);
}
.explore-generators-cards .v-card > div.v-card__text {
  color: var(--vscode-editorCodeLens-foreground, #999999);
}
.explore-generators-cards {
  overflow-y: auto;
  margin: 0px;
  height: calc(100% - 4rem);
}
</style>
