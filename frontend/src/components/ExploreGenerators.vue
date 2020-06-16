<template>
  <v-container>
    <v-text-field :readonly="readonly" label="Total" :placeholder="placeholder" outlined></v-text-field>
    <v-text-field label="Search" v-model="query" @input="onSearchChange"></v-text-field>
    <v-select :items="items" label="Author" dense @change="onAuthorChange"></v-select>

    <v-row class="ma-2">
      <v-col md="4" class="pa-3 d-flex flex-column" v-for="(gen, i) in gens" :key="i">
        <v-card class="elevation-5 flex d-flex flex-column">
          <v-card-title primary-title>
            <h3 class="headline mb-0">{{ gen.package.name }}</h3>
          </v-card-title>

          <v-card-text style="overflow-y: auto; height:100px">
            <div class="body-1">{{ gen.package.description }}</div>
            <v-divider light style="margin-top:15px;" />
            <v-divider light />
          </v-card-text>

          <v-card-subtitle v-text="gen.package.version"></v-card-subtitle>
          <v-card-actions>
            <v-btn color="orange" @click="onDownload(gen)" text>Download</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// gens: [{package: {name: "n1", "description": "d1", "version": "111"}},
//                 {package: {name: "n2", "description": "d2", "version": "222"}},
//                 {package: {name: "n3", "description": "d3", "version": "333"}}],

import * as _ from "lodash";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
export default {
  data() {
    return {
      items: ["all", "sap", "wix", "microsoft"],
      rpc: Object,
      gens: [],
      total: 0,
      readonly: true,
      query: "",
      author: ""
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
      return _.debounce(this.getFilteredGenerators, 500);
    }
  },
  methods: {
    onSearchChange() {
      this.debouncedGenFilterChange();
    },
    onDownload(gen) {
      this.rpc.invoke("doDownload", [gen]);
    },
    onAuthorChange(author) {
      this.author = author === "all" ? "" : author;
      this.debouncedGenFilterChange();
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    async getFilteredGenerators() {
      const res = await this.rpc.invoke("getFilteredGenerators", [
        this.query,
        this.author
      ]);
      this.gens = res[0];
      this.total = res[1];
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
  }
};
</script>
