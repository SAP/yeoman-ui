<template>
  <div>
    <v-stepper :model-value="currentStep - 1">
      <template v-for="index in steps" :key="index">
        <!-- Todo Check why there's an empty step -->
        <v-stepper-item
          :editable="currentStep > index"
          :title="prompts[index - 1] ? prompts[index - 1].name : ''"
          :complete="currentStep > index"
          :class="getStepClass(currentStep, index)"
          @click="gotoStep(currentStep - index)"
        />
        <div class="breadcrumbs-container">
          <YOUIBreadcrumbs
            :id="`breadcrumbs-${index}`"
            class="breadcrumbs"
            :breadcrumbs="answers[prompts[index - 1] ? prompts[index - 1].name : undefined]"
          />
        </div>
      </template>
    </v-stepper>
  </div>
</template>

<script setup>
import { computed, ref, toRefs, unref, watchEffect } from "vue";
import YOUIBreadcrumbs from "../components/YOUIBreadcrumbs.vue";

const props = defineProps({
  promptIndex: {
    type: Number,
    default: 0,
  },
  prompts: {
    type: Array,
    default: () => [],
  },
  promptAnswers: {
    type: Object,
    default: () => {},
  },
});

const { promptIndex, prompts, promptAnswers } = toRefs(props);

const emits = defineEmits(["onGotoStep"]);

const answers = ref({});

const currentStep = ref(0);

const steps = computed(() => {
  return unref(prompts).length;
});

watchEffect(() => {
  currentStep.value = unref(promptIndex) + 1;
});

watchEffect(() => {
  if (unref(promptAnswers) && unref(promptAnswers).promptName && unref(promptAnswers).answers) {
    // Vue 2 requires a new object for reactivity to trigger updates
    answers.value = Object.assign({}, unref(answers), {
      [unref(promptAnswers).promptName]: unref(promptAnswers).answers,
    });
  }
});

const getStepClass = (currentStep, index) => {
  return {
    "step-linkable": currentStep > index,
  };
};
const gotoStep = (index) => {
  // numOfSteps is number of steps to go back
  if (index > 0) {
    emits("onGotoStep", index);
  }
};

defineExpose({
  gotoStep,
  steps,
  currentStep,
  getStepClass,
});
</script>

<style lang="scss">
div.v-stepper .v-stepper-item {
  padding-left: 0px;
  padding-top: 10px;
  padding-bottom: 10px;
  opacity: 0.4;
  /* Step bullet  */
  .v-stepper-item__avatar {
    font-size: 0px;
    background-color: transparent !important; // Required since  Vuetify `.v-application .primary` adds background-color !important
    color: var(--vscode-editor-foreground, #616161);
    border: 1px solid;
    height: 12px !important;
    width: 12px !important;
    min-width: 12px;
    margin-right: 10px;
    transition: 0.3s ease-in-out;
    .v-icon.v-icon {
      font-size: 0;
    }
  }
  /* Step label */
  .v-stepper-item__title {
    font-weight: bold;
    font-size: 14px;
    line-height: 17px;
    color: var(
      --vscode-editor-foreground,
      #616161
    ) !important; // Required since Vuetify adds inline color for selector: `.theme--dark.v-stepper .v-stepper__label`
    transition: 0.3s ease-in-out;
    text-align: left;
  }
  &--complete {
    opacity: unset !important; // Overrides the default opacity of .v-stepper-item in case of complete step
    .v-stepper-item__title {
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
    .v-stepper-item__avatar {
      background-color: var(
        --vscode-textLink-foreground,
        #3794ff
      ) !important; // Required since Vuetify adds background-color !important for selector `.v-application .primary`
      border: none;
    }
  }
  &--selected {
    opacity: 1 !important; // Overrides the default opacity of .v-stepper-item in case of selected step
    .v-stepper-item__avatar {
      background-color: transparent !important;
      border-color: var(
        --vscode-editor-foreground,
        #616161
      ) !important; // Required since Vuetify adds border-color !important for selector `.v-application .primary`
    }
  }
}

div.v-application {
  div.left-col {
    overflow-y: auto;
  }
  div.v-stepper {
    background-color: var(--vscode-editor-background, #252526);
    box-shadow: none;
    padding-top: 10px;
    .breadcrumbs-container {
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
