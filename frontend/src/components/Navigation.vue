<template>
  <div>
    <v-stepper v-model="currentStep" vertical>
      <template v-for="index in steps">
        <!-- Todo Check why there's an empty step -->
        <v-stepper-step
          :key="`${index}-step`"
          :step="index"
          :complete="currentStep > index"
          complete-icon="circle-slice-8"
        >{{ prompts[index - 1] ? prompts[index - 1].name : "" }}</v-stepper-step>
        <v-stepper-content :step="index" :key="`${index}-content`"></v-stepper-content>
      </template>
    </v-stepper>
  </div>
</template>


<script>
export default {
  name: "Navigation",
  props: ["promptIndex", "prompts"],
  data() {
    return {
      currentStep: 1,
      steps: 1
    };
  },

  watch: {
    promptIndex(val) {
      this.$nextTick(() => {
        this.currentStep = val + 1;
      });
    },
    prompts(val) {
      this.steps = val.length;
    }
  }
};
</script>
<style>
div.v-stepper.v-stepper--vertical {
  background-color: transparent;
  box-shadow: none;
  border-radius: 0;
}

div.v-stepper div.v-stepper__step {
  padding: 24px;
  border-bottom: 1px solid var(--vscode-terminal-ansiBlack, #000000);
}

.v-stepper__step--complete.v-stepper__step {
  background: var(--vscode-menu-background, #252426);
}
.v-stepper__step--active.v-stepper__step {
  background: var(--vscode-titleBar-activeBackground, #383838);
}
.v-stepper__step--inactive.v-stepper__step {
  background: var(--vscode-menu-background, #252426);
}

span.v-stepper__step__step {
  font-size: 0;
  margin-right: 1rem;
  height: 10px;
  min-width: 10px;
  width: 10px;
}

/* TODO Erez to give styles for completed step */
.v-stepper__step--complete .v-stepper__step__step {
  background: var(--vscode-editorCodeLens-foreground, #1d1d1d);
}
.v-stepper__step--active .v-stepper__step__step {
  background: var(--vscode-editorCodeLens-foreground, #898989);
}
.v-stepper__step--inactive .v-stepper__step__step {
  background: var(--vscode-editorCodeLens-foreground, #1d1d1d);
}

/* TODO Erez to give styles for completed step */
div.v-stepper
  div.v-stepper__step.v-stepper__step--complete
  div.v-stepper__label {
  color: var(--vscode-editorGroup-border, #383838);
}
div.v-stepper div.v-stepper__step.v-stepper__step--active div.v-stepper__label {
  color: var(--vscode-settings-checkboxForeground, #f0f0f0);
}
div.v-stepper
  div.v-stepper__step.v-stepper__step--inactive
  div.v-stepper__label {
  color: var(--vscode-editorGroup-border, #383838);
}

div.v-stepper.v-stepper--vertical .v-stepper__content:not(:last-child) {
  margin-left: 28px;
  margin-top: -16px;
  border-left: 1px dotted var(--vscode-editorCodeLens-foreground, #737373);
  position: relative;
  z-index: 100;
}
</style>
