<template>
  <v-app>
    <v-content>
      <ExploreGenerators/>
    </v-content>
  </v-app>
</template>

<script>
import ExploreGenerators from "./components/ExploreGenerators";

export default {
  name: "exploregens",
  components: {
    ExploreGenerators,
  }
};
</script>