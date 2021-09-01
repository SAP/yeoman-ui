<template>
  <div>
    <span class="trash-button" @click="deleteRow()"
      ><font-awesome-icon icon="trash"
    /></span>
  </div>
</template>

<script>
import Vue from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faTrash);

Vue.component("font-awesome-icon", FontAwesomeIcon);

export default Vue.extend({
  methods: {
    deleteRow() {
      this.params.context.componentParent.deleteSelectedRow([
        this.params.node.data,
      ]);
    },
  },
});
</script>
<style>
.trash-button {
  width: 20px !important;
  min-width: 20px !important;
  background-color: transparent !important;
  box-shadow: none !important;
  position: absolute !important;
  right: 12px !important;
}
</style>
