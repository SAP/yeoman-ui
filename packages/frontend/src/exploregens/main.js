import { createApp } from "vue";
import ExploreGensApp from "./App.vue";
import vuetify from "../plugins/vuetify";

const app = createApp(ExploreGensApp);

app.use(vuetify);
app.mount("#exploregens");
