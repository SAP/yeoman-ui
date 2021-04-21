import Vue from "vue";
import Vuetify from "vuetify/lib";
import "../assets/css/globalStyles.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: "md",
  },
});
