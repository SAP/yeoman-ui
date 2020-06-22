<template>
  <v-app id="exploregens">
    <v-container>
      <v-row>
        <v-col :cols="8">
          <v-text-field label="Search" v-model="query" @input="onQueryChange" />
        </v-col>
        <v-col :cols="2">
          <v-select
            :items="items"
            v-model="recommended"
            label="Recommended"
            @change="onQueryChange"
          />
        </v-col>
        <v-col :cols="2">
          <v-text-field :readonly="readonly" label="Total" :placeholder="placeholder" outlined />
        </v-col>
      </v-row>

      <v-row>
        <v-col md="3" class="pa-3 d-flex flex-column" v-for="(gen, i) in gens" :key="i">
          <v-card width="300" class="d-flex flex-column mx-auto" height="300" tile elevation="2">
            <v-card-title primary-title>
              <h3 class="headline mb-0">{{ gen.package.name }}</h3>
            </v-card-title>
            <v-card-text style="overflow-y: auto; height:200px" v-text="gen.package.description" />
            <v-card-actions>
              <v-menu bottom left>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn v-bind="attrs" v-on="on" :loading="loading" @click="getActions(gen)">
                    <v-icon>mdi-dots-vertical</v-icon>
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
      loading: false,
      rpc: Object,
      gens: [],
      total: 0,
      readonly: true,
      query: "",
      recommended: ALL_GENS
    };
  },
  computed: {
    placeholder() {
      if (this.total === _.size(this.gens)) {
        return _.toString(this.total);
      }

      return `${_.size(this.gens)} / ${this.total}`;
    },
    debouncedGenFilterChange() {
      return _.debounce(this.getFilteredGenerators, 300);
    }
  },
  methods: {
    async getActions(gen) {
      if (!gen.disabledToHandle) {
        this.genActions = [];
        this.loading = true;
        const isInstalled = await this.rpc.invoke("isInstalled", [gen]);
        this.genActions = isInstalled === true ? [`Uninstall`] : [`Install`];
        this.loading = false;
      }
    },
    async onAction(gen, actionName) {
      gen.disabledToHandle = true;
      this.loading = true;
      const action = _.lowerCase(actionName);
      await this.rpc.invoke(action, [gen]);
      gen.disabledToHandle = false;
      this.loading = false;
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
