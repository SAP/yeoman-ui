<template>
  <div>
    <b-nav tabs>
      <b-nav-item disabled>
        <b>Yeoman UI:</b> {{yeomanName}}
      </b-nav-item>
      <b-nav-item disabled>Step: {{ currentStep }}/{{ numOfSteps }}</b-nav-item>
      <b-nav-item disabled>{{ stepName }}</b-nav-item>
    </b-nav>
  </div>
</template>

<script>

export default {
  name: "Header",
  props: [
    'yeomanName',
    'currentStep',
    'numOfSteps',
    'stepName'
  ]
}

</script>