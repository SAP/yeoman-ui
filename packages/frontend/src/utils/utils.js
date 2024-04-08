const removeClass = (elementId, className, interval) => {
  const refreshId = setInterval(() => {
    const elem = document.getElementById(elementId);
    if (elem) {
      elem.classList.remove(className);
      clearInterval(refreshId);
    }
  }, interval);
};

export default {
  addAndRemoveClass: (elementId, className, interval = 100) => {
    const refreshId = setInterval(() => {
      const elem = document.getElementById(elementId);
      if (elem) {
        elem.classList.add(className);
        clearInterval(refreshId);
        removeClass(elementId, className, interval);
      }
    }, interval);
  },
  // roughly based on underscore.js:
  //   https://github.com/jashkenas/underscore/blob/1.9.2/underscore.js#L887
  debounce: function (func, wait) {
    var timeout;

    return function executedFunction() {
      var context = this;
      var args = arguments;

      var later = function () {
        timeout = null;
        func.apply(context, args);
      };

      clearTimeout(timeout);

      timeout = setTimeout(later, wait);

      if (!timeout) func.apply(context, args);
    };
  },
};
