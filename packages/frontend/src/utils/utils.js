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
};
