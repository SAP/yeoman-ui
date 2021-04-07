import Vue from "vue";
import ExploreGensApp from "./ExploreGensApp";
import vuetify from "./plugins/vuetify";
import "./assets/css/globalStyles.css";

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: (h) => h(ExploreGensApp),
}).$mount("#exploregens");
