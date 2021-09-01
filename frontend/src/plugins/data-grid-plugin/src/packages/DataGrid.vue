
<template>
  <div>
    <ag-grid-vue
      class="ag-theme-alpine ag-grid-plugin"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :context="gridContext"
      :frameworkComponents="frameworkComponents"
      :gridOptions="gridOptions"
      @grid-ready="onGridReady"
      @cell-value-changed="handleCellValueChanged"
      :singleClickEdit="true"
      :stopEditingWhenGridLosesFocus="true"
      :tooltipShowDelay="tooltipShowDelay"
    >
    </ag-grid-vue>

    <v-btn @click="addNewRow()">Add</v-btn>
  </div>
</template>

<script>
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import { AgGridVue } from "ag-grid-vue";
import DataGridButtons from "./DataGridButtons";
import DropdownCellEditor from "./DropdownCellEditor";
import CheckboxCellEditor from "./CheckboxCellEditor";
import DatePickerCellEditor from "./DatePickerCellEditor.vue";

import numeral from "numeral";

export default {
  name: "DataGrid",

  props: {
    question: Object,
  },

  data: () => {
    return {
      gridOptions: null,
      columnDefs: null,
      rowData: null,
      columnPromisesData: [],
      defaultColDef: null,
      tooltipShowDelay: null,
    };
  },

  components: {
    AgGridVue,
  },

  beforeMount() {
    this.initGrid();
  },

  mounted: function () {
    this.rowData = this.question.answer || [];
  },

  methods: {
    onGridReady(params) {
      this.gridApi = params.api;
      this.columnApi = params.columnApi;
    },

    async initGrid() {
      this.gridOptions = {};
      this.gridContext = { componentParent: this };
      this.tooltipShowDelay = 1000;
      this.frameworkComponents = {
        dataGridButtons: DataGridButtons,
        dropdownCellEditor: DropdownCellEditor,
        checkboxCellEditor: CheckboxCellEditor,
        datePickerCellEditor: DatePickerCellEditor,
      };

      this.defaultColDef = {
        editable: true,
      };

      this.columnDefs = [];
      if (
        this.question.guiOptions &&
        this.question.guiOptions.columns &&
        Array.isArray(this.question.guiOptions.columns)
      ) {
        try {
          await this.createGridColumns();
        } catch (err) {
          console.log(err);
        }
      }
    },

    async createGridColumns() {
      for (
        let index = 0;
        index < this.question.guiOptions.columns.length;
        index++
      ) {
        const col = this.question.guiOptions.columns[index];

        if (
          col.enumProvider &&
          typeof this.question[col.enumProvider] === "function"
        ) {
          this.columnPromisesData.push({
            promise: this.createColumnPromise(),
            index,
            column: col,
          });
        }
      }

      if (this.columnPromisesData.length > 0) {
        const allPromisses = Promise.all(
          this.columnPromisesData.map((pd) => pd.promise)
        );

        setTimeout(() => {
          for (const pd of this.columnPromisesData) {
            this.$emit(
              "customEvent",
              this.question.name,
              pd.column.enumProvider,
              this.enumProviderCallback,
              pd.column,
              pd.index
            );
          }
        }, 0);

        await allPromisses;
      }

      this.question.guiOptions.columns.forEach((col) => {
        let columnsDef = {
          headerName: col.header,
          field: col.field,
          editable: this.getEditable(col),
          readonly: col.editable !== undefined && !col.editable,
          cellRendererFramework: this.getCellRendererFramework(col),
          enum: col.enum,
          flex: col.width === undefined && 1,
          width: col.width,
          minWidth: 70,
          resizable: true,
          valueFormatter: (params) => this.cellValueFormatter(params, col),
          format: col.format,
          headerTooltip: col.header,
          tooltipField: col.field,
          customOptions: {
            valueProperty: col.valueProperty,
            displayProperty: col.displayProperty,
          },
        };
        columnsDef.editable = this.getEditable(columnsDef);
        this.columnDefs.push(columnsDef);
      });

      this.columnDefs.push({
        field: "",
        pinned: "right",
        cellRendererFramework: DataGridButtons,
        width: 50,
        editable: false,
      });
    },

    createColumnPromise(index) {
      let res, rej;

      let promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
      });

      promise.resolve = res;
      promise.reject = rej;
      promise.index = index;

      return promise;
    },

    enumProviderCallback(result) {
      const { index, data } = result;

      const promiseToResolve = this.columnPromisesData.find(
        (pd) => pd.index === index
      );
      if (promiseToResolve) {
        promiseToResolve.promise.resolve();
        this.question.guiOptions.columns[index].enum = data;
      }
    },

    handleCellValueChanged() {
      this.answerChanged();
    },

    getEditable(col) {
      if (col.cellRendererFramework) {
        return false;
      } else {
        return col.editable !== undefined ? col.editable : true;
      }
    },

    cellValueFormatter(params, colDef) {
      if (colDef.dataType === "number") {
        if (params.value) {
          if (
            colDef.format === undefined ||
            (colDef.format !== undefined &&
              colDef.format.formatString === undefined)
          ) {
            return this.formatNumber(params, "0,0.00");
          } else {
            return this.formatNumber(params, colDef.format.formatString);
          }
        }
      } else if (colDef.dataType === "integer") {
        if (params.value) {
          if (
            colDef.format === undefined ||
            (colDef.format !== undefined &&
              colDef.format.formatString === undefined)
          ) {
            return this.formatNumber(params, "0,0");
          } else {
            return this.formatNumber(params, colDef.format.formatString);
          }
        }
      }
    },

    formatNumber(params, formatString) {
      let ret = numeral(params.value).format(formatString);
      params.data[params.colDef.field] = numeral(ret).value();
      return ret;
    },

    getCellRendererFramework(col) {
      if (col.enum) {
        return DropdownCellEditor;
      } else if (col.dataType === "boolean") {
        return CheckboxCellEditor;
      } else if (col.dataType === "string" && col.dataFormat === "date") {
        return DatePickerCellEditor;
      }

      return undefined;
    },

    addNewRow() {
      this.gridApi.applyTransaction({ add: [this.createNewRowData()] });
      this.answerChanged();
    },

    deleteSelectedRow(selectedData) {
      this.gridApi.applyTransaction({ remove: selectedData });
      this.answerChanged();
    },

    answerChanged() {
      let items = [];
      this.gridApi.forEachNode(function (node) {
        items.push(node.data);
      });
      this.$emit("answerChanged", this.question.name, items);
    },

    createNewRowData() {
      return {};
    },
  },
};
</script>
<style>
ag-grid-vue {
  width: 100% !important;
}
.ag-grid-plugin {
  border: 1px solid var(--vscode-list-hoverBackground) !important;
  height: 300px
}
ag-grid-vue .ag-cell {
  font-size: var(--vscode-font-size) !important;
  font-family: var(--vscode-font-family) !important;
}
ag-grid-vue .ag-cell-label-container {
  font-size: var(--vscode-font-size) !important;
  font-weight: var(--vscode-editor-font-weight) !important;
}
ag-grid-vue .ag-row,
.ag-header-row,
.ag-pinned-right-header,
.ag-header-row,
.ag-header-row-column,
.ag-header-cell,
.ag-header,
.ag-root-wrapper,
.ag-cell {
  border: none !important;
}

.ag-header {
  background-color: hsla(0, 0%, 51%, 0.04) !important;
}
.ag-root,
.ag-row {
  background-color: var(--vscode-editor-background) !important;
}

.ag-row:hover {
  background-color: var(--vscode-list-hoverBackground) !important;
}
.ag-header-cell-label,
.ag-cell {
  color: var(--vscode-foreground) !important;
}

.ag-input-field-input.ag-text-field-input {
  background-color: var(--vscode-input-background) !important;
  color: var(--vscode-input-foreground) !important;
}
</style> 
