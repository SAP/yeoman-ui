<template>
  <div>
    <v-stepper v-model="currentStep" dark vertical>
      <template v-for="index in steps">
        <!-- Todo Check why there's an empty step -->
        <v-stepper-step
          :key="`${index}-step`"
          :step="index"
          :complete="currentStep > index"
          @click="gotoStep(currentStep - index)"
          :class="getStepClass(currentStep, index)"
        >
          {{ prompts[index - 1] ? prompts[index - 1].name : "" }}
        </v-stepper-step>
        <v-stepper-content :step="index" :key="`${index}-content`">
          <Breadcrumbs
            class="breadcrumbs"
            :id="`breadcrumbs-${index}`"
            :breadcrumbs="answers[prompts[index - 1] ? prompts[index - 1].name : undefined]"
          />
        </v-stepper-content>
      </template>
    </v-stepper>
  </div>
</template>

<script>
import Breadcrumbs from "../components/Breadcrumbs.vue";
export default {
  name: "Navigation",
  components: {
    Breadcrumbs,
  },
  props: ["promptIndex", "prompts", "promptAnswers"],
  data() {
    return {
      currentStep: 1,
      steps: 1,
      answers: {},
    };
  },
  methods: {
    getStepClass(currentStep, index) {
      return {
        "step-linkable": currentStep > index,
      };
    },
    gotoStep(numOfSteps) {
      // numOfSteps is number of steps to go back
      if (numOfSteps > 0) {
        this.$emit("onGotoStep", numOfSteps);
      }
    },
  },
  watch: {
    promptIndex(val) {
      this.$nextTick(() => {
        this.currentStep = val + 1;
      });
    },
    prompts(val) {
      this.steps = val.length;
    },
    promptAnswers(val = {}) {
      if (val.promptName && val.answers) {
        // Vue 2 requires a new object for reactivity to trigger updates
        this.answers = Object.assign({}, this.answers, { [val.promptName]: val.answers });
      }
    },
  },
};
</script>

<style lang="scss">
div.v-stepper div.v-stepper__step {
  padding-left: 0px;
  padding-top: 10px;
  padding-bottom: 10px;
  /* Step bullet  */
  .v-stepper__step__step {
    font-size: 0px;
    background-color: transparent !important; // Required since  Vuetify `.v-application .primary` adds background-color !important
    color: var(--vscode-editor-foreground, #616161);
    border: 1px solid;
    height: 12px;
    width: 12px;
    min-width: 12px;
    margin-right: 10px;
    transition: 0.3s ease-in-out;
    .v-icon.v-icon {
      font-size: 0;
    }
  }
  /* Step label */
  .v-stepper__label {
    font-weight: bold;
    font-size: 14px;
    line-height: 17px;
    color: var(
      --vscode-editor-foreground,
      #616161
    ) !important; // Required since Vuetify adds inline color for selector: `.theme--dark.v-stepper .v-stepper__label`
    transition: 0.3s ease-in-out;
  }
  &--complete {
    .v-stepper__label {
      color: var(
        --vscode-textLink-foreground,
        #3794ff
      ) !important; // Override Vuetifys theme specific selectors `.theme--dark.v-stepper .v-stepper__step--complete .v-stepper__label`
      text-decoration-line: underline;
      cursor: pointer;
      &:hover {
        text-decoration-line: none;
      }
    }
    .v-stepper__step__step {
      background-color: var(
        --vscode-textLink-foreground,
        #3794ff
      ) !important; // Required since Vuetify adds background-color !important for selector `.v-application .primary`
      border: none;
    }
  }
  &--active {
    .v-stepper__step__step {
      background-color: transparent !important;
      border-color: var(
        --vscode-editor-foreground,
        #616161
      ) !important; // Required since Vuetify adds border-color !important for selector `.v-application .primary`
    }
  }
  &--inactive {
    .v-stepper__label,
    .v-stepper__step__step {
      background-color: var(
        --vscode-editor-background,
        #252526
      ) !important; // Override Vuetifys theme specific selector `.theme--dark.v-stepper .v-stepper__step:not(.v-stepper__step--active):not(.v-stepper__step--complete):not(.v-stepper__step--error) .v-stepper__step__step`
    }
    opacity: 0.4;
  }
}

div.v-application {
  div.left-col {
    overflow-y: auto;
  }
  div.v-stepper.v-stepper--vertical {
    background-color: var(--vscode-editor-background, #252526);
    box-shadow: none;
    padding-top: 10px;
    .v-stepper__content {
      margin-left: 5px;
      margin-bottom: 0px;
      margin-top: 0px;
      padding-top: 0px;
      padding-bottom: 20px;
      padding-left: 16px;
      transition: none;
      &:not(:last-child) {
        border-left: 1px solid var(--vscode-editorWidget-border, #c8c8c8);
        transition: none;
      }
      &:last-child {
        padding-left: 17px; // Adjust for border-left
      }
      .v-stepper__wrapper {
        height: auto !important; // Override inline height: 0px for complete and inactive steps.
        transition: none;
      }
      .breadcrumbs {
        transition: max-height 0.3s ease-in-out;
      }
    }
  }
}
</style>
