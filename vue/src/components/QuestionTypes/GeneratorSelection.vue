<template>
  <div>
    <b-card-group deck>
      <b-card
        v-for="(choice, index) in currentQuestion.choices"
        :key="index"
        :title="choice.name"
        :img-src= "(choice.imageUrl ? choice.imageUrl : `${publicPath}generator.png`)"
        img-alt="Image"
        img-top
        tag="article"
        style="max-width: 20rem;"
        class="mb-2 border border-success"
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
      publicPath: process.env.BASE_URL
    };
  },
  mounted() {}
};
</script>
<style>
.card:hover {
  cursor: pointer;
}

</style>