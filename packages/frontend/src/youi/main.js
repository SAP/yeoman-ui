import Vue from "vue";
import YoUiApp from "./App";

import vuetify from "../plugins/vuetify";
import "@sap-devx/inquirer-gui/dist/form.css";

import Form from "@sap-devx/inquirer-gui";

const options = { vuetify };
Vue.use(Form, options);

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: (h) => h(YoUiApp),
}).$mount("#app");
