<template>
  <v-card
    max-width="400"
    class="mx-auto"
  >
    <v-container>
      <v-text-field :readonly="readonly" label="Total" :placeholder="placeholder" outlined></v-text-field>
      <v-text-field label="Search" v-model="query" @input="onSearchChange"></v-text-field>
      <v-select
          :items="items"
          label="Author"
          dense
          @change="onAuthorChange"
        ></v-select>
      <v-row dense>
        <v-col 
          v-for="(gen, i) in gens"
          :key="i"
          cols="6"
        >
          <v-card
            dark
          >
            <div class="d-flex flex-no-wrap justify-space-between">
              <div>
                <v-card-title
                  class="headline"
                  v-text="gen.package.name"
                ></v-card-title>

                <v-card-subtitle v-text="gen.package.description"></v-card-subtitle>
                <v-card-subtitle v-text="gen.package.version"></v-card-subtitle>
                <v-card-actions>
                  <v-btn color="orange" @click="onDownload(gen)" text>Download</v-btn>
                  </v-card-actions>
              </div>

              <v-avatar
                class="ma-3"
                size="125"
                tile
              >
              </v-avatar>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
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
      }
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
        this.author = (author === "all" ? "" : author);
        this.debouncedGenFilterChange();
      },
      isInVsCode() {
        return typeof acquireVsCodeApi !== "undefined";
      },
      async getFilteredGenerators() {
        const res = await this.rpc.invoke("getFilteredGenerators", [this.query, this.author]);
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
  }
</script>
