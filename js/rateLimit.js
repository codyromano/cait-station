(function (exports) {
  'use strict';

  exports.rateLimit = function (fn, threshold) {
    // Time at which the function was last called
    var lastCall; 

    return function () {
      var now = new Date().getTime();

      if (!isNaN(lastCall) && now - lastCall < threshold) {
        // Not enough time has passed
        return false;
      }

      lastCall = now; 
      return fn.apply(fn, arguments);
    };
  }

})(window);