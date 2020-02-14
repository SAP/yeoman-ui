import Vue from 'vue'
import App from './App'

import vuetify from "./plugins/vuetify";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "./assets/css/globalStyles.css";
import "@sap-devx/inquirer-gui/dist/form.css";

import Form from "@sap-devx/inquirer-gui";

const options = { vuetify };
Vue.use(Form, options);

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App),
}).$mount('#app')
