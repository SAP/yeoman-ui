<template>
  <div>
    <b-card-group deck>
      <b-card
        v-for="(choice, index) in currentQuestion.choices"
        v-on:click="select"
        :key="index"
        :title="choice.name"
        :img-src= "(choice.imageUrl ? choice.imageUrl : `${publicPath}generator.png`)"
        img-alt="Image"
        img-top
        tag="article"
        style="max-width: 20rem;"
        class="mb-2"
        :generatorName="choice.name"
      >
        <b-card-text>{{choice.message}}</b-card-text>

      </b-card>
      
    </b-card-group>
  </div>
</template>

<script>
export default {
  name: "GeneratorSelection",
  components: {},
  props: {
    currentQuestion: Object,
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
      selected: Object
    };
  },
  methods: {
    select(event) {
      if (this.selected && this.selected.classList) {
        this.selected.classList.remove("border", "border-warning");
      }
      event.currentTarget.classList.add("border", "border-warning");
      this.selected = event.currentTarget;
      this.$emit('generatorSelected', event.currentTarget.getAttribute("generatorName"));
    }
  },
  mounted() {}
};
</script>
<style>
.card:hover {
  cursor: pointer;
}

</style>