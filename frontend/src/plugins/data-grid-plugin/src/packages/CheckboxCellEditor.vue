
<template>
  <input
    type="checkbox"
    @click="checkedHandler($event)"
    :checked="params.value"
    :disabled="readonly"
  />
</template>

<script>
import Vue from "vue";

export default Vue.extend({
  beforeMount() {
    this.readonly = this.params.colDef.readonly;
  },
  methods: {
    checkedHandler(event) {
      let checked = event.target.checked;
      this.params.setValue(checked);
      this.params.context.componentParent.answerChanged();
    },
  },
});
</script> 
