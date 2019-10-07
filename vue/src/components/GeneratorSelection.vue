<template>
  <div>
    <b-card-group deck>
      <b-card
        v-for="(generator, index) in generators"
        :key="index"
        :title="generator.name"
        :img-src="generator.imageUrl"
        img-alt="Image"
        img-top
        tag="article"
        style="max-width: 20rem;"
        class="mb-2"
      >
        <b-card-text>{{generator.description}}</b-card-text>

        <b-button href="#" variant="primary">Go somewhere</b-button>
      </b-card>
      
    </b-card-group>
  </div>
</template>

<script>
export default {
  name: "GeneratorSelector",
  components: {},
  props: {
    generators: Object
  },
  data() {
    return {};
  }
};
</script>