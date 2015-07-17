(function (exports) {
  'use strict';

  exports.PubSub = (function () {
    var callbacks = {};

    return {
      subscribe: function (eventName, callback) {
        callbacks[eventName] = callbacks[eventName] || [];
        callbacks[eventName].push(callback);
      },
      publish: function (eventName) {
        var args = [].slice.call(arguments);
        args.shift(); // Remove eventName

        callbacks[eventName] = callbacks[eventName] || [];
        callbacks[eventName].forEach(function (cb) {
          cb.apply(undefined, args);
        });
      }
    };
  })();

})(window);

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


(function (exports, PubSub) {
  'use strict';

  var SoundLibrary = {
      'button-click' : {
        mp3: 'audio/button-click.mp3'
      }
  };

  exports.getSoundEffect = function (effectName) {
    var effect = SoundLibrary[effectName];
    if (!effect) {
      throw new Error("Effect '" + effectName + "' is not in library");
    }
    // TODO: Choose format by browser
    return new Audio(effect.mp3);
  };

  PubSub.subscribe('controllerKeyPressed', function () {
    getSoundEffect('button-click').play();
  });

})(window, PubSub);


(function (exports, PubSub, UI) {
  'use strict';

  exports.ButtonPressIndicator = function (rootElem, type) {
    // Create a PlayStation-like button based on the sprite
    var button = document.createElement('div');
    button.className = 'controller-button sprite button-' + type;
    rootElem.appendChild(button);

    window.setTimeout(function () {
      rootElem.removeChild(button);
    }, 1750);
  };

  PubSub.subscribe('controllerKeyPressed', function (type) {
    new ButtonPressIndicator(UI('#root'), type);
  });

})(window, PubSub, UI);


PubSub.subscribe('topMenuButtonPressed', function (button) {
  console.log('pressed');
});
