<template>
  <v-app id="exploregens">
    <v-container>
      <v-row class="mb-6">
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

      <v-row class="ma-2">
        <v-col md="4" class="pa-3 d-flex flex-column" v-for="(gen, i) in gens" :key="i">
          <v-card
            width="350"
            class="d-flex flex-column mx-auto"
            height="350"
            tile
            hover
            elevation="2"
          >
            <v-card-title primary-title>
              <h3 class="headline mb-0">{{ gen.package.name }}</h3>
            </v-card-title>
            <v-card-text style="overflow-y: auto; height:200px" v-text="gen.package.description" />
            <v-card-actions>
              <v-btn large dark color="blue" @click="onDownload(gen)">Download</v-btn>
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
    onDownload(gen) {
      this.rpc.invoke("doDownload", [gen]);
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
    setupRpc() {
      /* istanbul ignore if */
      if (this.isInVsCode()) {
        this.setVscodeApiOnWindow();
        this.rpc = new RpcBrowser(window, window.vscode);
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
