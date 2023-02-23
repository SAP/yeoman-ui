<template>
  <div>
    <div
      v-resize="calcIsMore"
      class="answer-box"
      :class="{ 'show-more': !showMore }"
      ref="answerBox"
      data-test="answerBox"
    >
      <div v-for="(item, index) in breadcrumbs" class="answer" data-test="breadcrumbs" :key="`answer-${index}`">
        <span>{{ item.label ? item.label + ":" : "" }} </span><span>{{ item.value }}</span>
      </div>
    </div>
    <div v-if="showMoreLess" @click="showMore = !showMore" class="more" data-test="moreLessButton">
      {{ showMore ? "More..." : "Less" }}
    </div>
  </div>
</template>

<script>
export default {
  name: "Breadcrumbs",
  props: ["breadcrumbs"],
  data: () => ({
    showMore: true,
    showMoreLess: false,
    answerBoxOverflowHeight: Number.MAX_SAFE_INTEGER, // Stores client height at the point overflow occurs
  }),
  methods: {
    calcIsMore() {
      if (this.$refs.answerBox.clientHeight < this.$refs.answerBox.scrollHeight - 8) {
        this.answerBoxOverflowHeight = this.$refs.answerBox.clientHeight;
      }
      this.showMoreLess = this.answerBoxOverflowHeight < this.$refs.answerBox.scrollHeight - 8;
    },
  },
  watch: {
    breadcrumbs: {
      handler(val) {
        if (val && val.length > 0) {
          // Wait until the virtual dom is updated to calc heights
          this.$nextTick(() => {
            this.calcIsMore();
          });
        }
      },
      flush: "post",
    },
  },
};
</script>

<style lang="scss">
$line-height: 1.42rem; // Approximation of line height (`lh` not available)

.v-stepper__wrapper {
  .answer-box {
    /* 5 lines */
    max-height: calc(5 * #{$line-height});
    transition: 0.3s max-height ease-in-out;
    overflow: hidden;
    &.show-more {
      max-height: calc(100 * #{$line-height});
    }
    .answer {
      padding-top: 5px;
      padding-bottom: 5px;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      line-break: anywhere;
      &:first-child {
        padding-top: 0px;
      }
    }
    .answer span:first-child {
      font-weight: 700;
    }
  }
  .more {
    color: var(--vscode-textLink-foreground, #3794ff) !important;
    text-decoration-line: underline;
    cursor: pointer;
    padding-top: 5px;
    width: fit-content;
    &:hover {
      text-decoration-line: none;
    }
  }
}
</style>
