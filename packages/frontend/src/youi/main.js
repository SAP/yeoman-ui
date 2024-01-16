import { createApp } from "vue";
import FileBrowserPlugin from "@sap-devx/inquirer-gui-file-browser-plugin";
import FolderBrowserPlugin from "@sap-devx/inquirer-gui-folder-browser-plugin";
import LoginPlugin from "@sap-devx/inquirer-gui-login-plugin";
import TilesPlugin from "@sap-devx/inquirer-gui-tiles-plugin";
import LabelPlugin from "@sap-devx/inquirer-gui-label-plugin";
import AutoCompletePlugin from "@sap-devx/inquirer-gui-auto-complete-plugin";
import YoUiApp from "./App.vue";

import vuetify from "../plugins/vuetify";
import "@sap-devx/inquirer-gui/dist/form.css";
import "@sap-devx/inquirer-gui-auto-complete-plugin/dist/autoCompletePlugin.css";
import "@sap-devx/inquirer-gui-label-plugin/dist/labelPlugin.css";
import "@sap-devx/inquirer-gui-tiles-plugin/dist/tilesPlugin.css";
import Form from "@sap-devx/inquirer-gui";

const plugins = [];

const app = createApp(YoUiApp, {
  plugins,
});

app.use(vuetify);

let options = {};
app.use(FileBrowserPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(FolderBrowserPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(LoginPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(TilesPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(LabelPlugin, options);
plugins.push(options.plugin);

options = {};
app.use(AutoCompletePlugin, options);
plugins.push(options.plugin);

const formOptions = { vuetify };
app.use(Form, formOptions);

app.mount("#app");
