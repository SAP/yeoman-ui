<template>
  <v-app id="exploregens">
    <v-main>
      <ExploreGenerators/>
    </v-main>
  </v-app>
</template>

<script>
import ExploreGenerators from './components/ExploreGenerators';

export default {
  name: 'exploregens',
  components: {
    ExploreGenerators,
  }
};
</script>