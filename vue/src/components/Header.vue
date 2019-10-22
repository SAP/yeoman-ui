<template>
  <div>
    <b-nav tabs>
      <b-nav-item disabled>
        <b>Yeoman UI:</b> {{yeomanName}}
      </b-nav-item>
      <b-nav-item disabled>Step: {{ currentPrompt }}/{{ numOfSteps }}</b-nav-item>
      <b-nav-item disabled>{{ stepName }}</b-nav-item>
    </b-nav>
  </div>
</template>

<script>

export default {
  name: "Header",
  props: [
    'yeomanName',
    'currentPrompt',
    'numOfSteps',
    'stepName'
  ]
}

</script>