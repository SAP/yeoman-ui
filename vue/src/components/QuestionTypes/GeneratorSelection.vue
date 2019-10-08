<template>
  <div>
    <b-card-group deck>
      <b-card
        v-for="(choice, index) in currentQuestion.choices"
        :key="index"
        :title="choice.name"
        img-alt="Image"
        img-top
        tag="article"
        style="width: 15rem"
        @click="selectChoice(index)"
        :class="selectClass(index)"
      >
        <b-card-text>{{choice.message}}</b-card-text>
        <b-card-text
          class="templateDocumentationClass">Template Documentation</b-card-text>

        <b-card-img :src="(choice.imageUrl ? choice.imageUrl : `${publicPath}generator.png`)"></b-card-img>
      </b-card>
    </b-card-group>
  </div>
</template>

<script>
export default {
  name: "GeneratorSelection",
  components: {},
  props: {
    currentQuestion: Object
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
      selectedIndex: null,
      selected: false
    };
  },
  watch: {
    currentQuestion: {
      immediate: true,
      handler() {
        this.selectedIndex = null;
        this.selected = false;
      }
    }
  },
  methods: {
    selectClass(index) {
      let selectClass = "";
      if (!this.selected && this.selectedIndex === index) {
        selectClass = "selected";
      } else {
        selectClass = "";
      }
      return selectClass;
    },
    selectChoice(index) {
      this.selectedIndex = index;
    }
  },
  mounted() {}
};
</script>
<style>
.card-title {
  font-size: 1rem;
  font-weight: bold
}
.card-text {
  font-size: 0.75rem;
}
.card-text.templateDocumentationClass {
  /* change this to vscode color for url */
  color: blue;
}
.card:hover {
  cursor: pointer;
}
.card.selected {
  border: solid;
}
</style>