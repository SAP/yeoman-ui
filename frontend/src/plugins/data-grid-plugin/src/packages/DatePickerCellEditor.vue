
<template>
  <div class="date-picker-editor">
    <date-picker
      v-model="dateFormatted"
      value-type="YYYY-MM-DD"
      :format="defaultDateFormat"
      @change="handleChange"
      :disabled="readonly"
    ></date-picker>
  </div>
</template>
<script>
import Vue from "vue";
import DatePicker from "vue2-datepicker";
import "vue2-datepicker/index.css";

export default Vue.extend({
  components: { DatePicker },
  data() {
    return {
      defaultDateFormat: null,
      readonly: false,
      dateFormatted: null,
    };
  },
  beforeMount() {
    if (this.params.value) {
      this.dateFormatted = new Date(this.params.value)
        .toISOString()
        .substr(0, 10);
    }
    this.readonly = this.params.colDef.readonly;
    this.defaultDateFormat =
      (this.params.colDef.format && this.params.colDef.format.formatString) ||
      "DD/MM/YYYY";
  },
  methods: {
    handleChange(answer) {
      if (answer !== undefined) {
        this.params.setValue(answer);
        this.params.context.componentParent.answerChanged();
      }
    },
  },
});
</script> 
<style>
.date-picker-editor .mx-input {
  background-color: var(--vscode-input-background);
  color: var(--vscode-foreground);
}
.date-picker-editor .mx-icon-calendar svg {
  fill: var(--vscode-foreground);
}
.date-picker-editor .mx-icon-clear svg {
  fill: var(--vscode-foreground);
}
.mx-calendar-content .cell.active {
  background-color: var(--vscode-input-background);
  color: var(--vscode-foreground);
}
.mx-table-date .today {
  color: var(--vscode-input-background);
}
.date-picker-editor .mx-datepicker {
  width: 100%;
}
</style>
