<template>
  <div>
    <v-stepper v-model="currentStep" dark vertical>
      <template v-for="index in steps">
        <!-- Todo Check why there's an empty step -->
        <v-stepper-step
          :key="`${index}-step`"
          :step="index"
          :complete="currentStep > index"
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
  border-bottom: 1px solid var(--vscode-editor-background, #1e1e1e);
}
 .v-stepper__step--complete.v-stepper__step {
  background: var(--vscode-editorWidget-background,#252526);
}
.v-stepper__step--active.v-stepper__step {
  background: var(--vscode-editor-background, #1e1e1e);
}
.v-stepper__step--inactive.v-stepper__step {
  background: var(--vscode-editorWidget-background,#252526);
}

span.v-stepper__step__step {
  font-size: 0;
  /* margin-right: 1rem; */
  height: 14px;
  min-width: 14px;
  width: 14px;
}
span.v-stepper__step__step .v-icon.v-icon {
  font-size: 0;
}
/* Have to be important since vuetify itself define this color important */
div.v-application div.v-stepper__step--complete span.v-stepper__step__step {
  background: var(--vscode-editorCodeLens-foreground, #999999) !important; 
}
div.v-application div.v-stepper__step--active span.v-stepper__step__step.primary{
    background: var(--vscode-foreground, #cccccc) !important;
}
div.v-application div.v-stepper__step--inactive .v-stepper__step__step {
  background: var(--vscode-input-background, #3c3c3c) !important;
}
div.v-stepper
  div.v-stepper__step.v-stepper__step--complete
  div.v-stepper__label {
  color: var(--vscode-editorCodeLens-foreground, #999999);
}
div.v-stepper div.v-stepper__step.v-stepper__step--active div.v-stepper__label {
  color: var(--vscode-foreground, #cccccc); ;
}
div.v-stepper
  div.v-stepper__step.v-stepper__step--inactive
  div.v-stepper__label {
  color: var(--vscode-editorCodeLens-foreground, #999999);
}
div.v-application div.v-stepper.v-stepper--vertical .v-stepper__content:not(:last-child) {
  margin-left: 29px;
  margin-top: -22px;
  margin-bottom: -18px;
  border-width: 0px;
  position: relative;
  z-index: 100;
  mask-image: url("../assets/dots.svg");
  mask-repeat: repeat-y;
  mask-size: 3px;
  background-position: left;
  background-color:var(--vscode-editorCodeLens-foreground, #999999);
}

</style>