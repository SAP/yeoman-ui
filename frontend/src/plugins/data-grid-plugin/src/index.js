import DataGrid from "./packages/DataGrid";

export default {
  install(Vue, options) {
    Vue.component('DataGrid', DataGrid);
    if (options) {
      options.plugin = {
        questionType: "data-grid",
        component: DataGrid
      };
    }
  }
}


