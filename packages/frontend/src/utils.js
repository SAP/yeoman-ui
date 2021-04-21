export default {
  removeClass: (elementId, className, interval = 100) => {
    const refreshId = setInterval(() => {
      const elem = document.getElementById(elementId);
      if (elem) {
        elem.classList.remove(className);
        clearInterval(refreshId);
      }
    }, interval);
  },
};
