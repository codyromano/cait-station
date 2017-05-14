/**
* @module UI
*/
(function (exports) {
  'use strict';

  var cache = {};

  function queryDOM (query) {
    // TODO: querySelector will be break in old versions of IE;
    // I'll consider supporting older browsers in the future
    var nodeList = document.querySelectorAll(query),
        array = [].slice.call(nodeList);

    // Return the first element if the array has only one item
    // It makes the result easier to work with
    return (array.length === 1) ? array[0] : array;
  }

  exports.UI = function (domQuery, clearCache) {
    var cachedElem = cache[domQuery];

    // This lets you re-fetch DOM elements, ignoring the cache
    // Useful in cases where you know the DOM has changed
    clearCache = (typeof clearCache === 'boolean') ? clearCache : false;

    if (cachedElem && clearCache === false) {
      return cachedElem;
    }
    return (cache[domQuery] = queryDOM(domQuery));
  };

  UI('.top-menu menuitem').forEach(function (item) {
    item.addEventListener('click', function () {
      PubSub.publish('topMenuButtonPressed');
    });
  });

  UI('.controller').addEventListener('click', function (ev) {
    var targetIsButton = ev.target.className.indexOf('button-') != -1;

    if (targetIsButton) {
      PubSub.publish('controllerKeyPressed', ev.target.dataset.button);
    }
  }, false);

})(window);