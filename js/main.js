/**
* @module PubSub
*/
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

(function (exports, PubSub, UI) {

  var TopMenu = {
    getButtonNameByTabId: function (tabId) {
      var result = ('#tab-' + tabId); 
      var validNames = [
        '#tab-controller',
        '#tab-cheats',
        '#tab-power-ups'
      ];

      return validNames.indexOf(result) != -1 ? result : false;
    },

    deselectButton: function (buttonName) {
      buttonName.classList.remove('selected');
    },

    getAllButtons: function () {
      return UI('.top-menu > a');
    },

    selectButton: function (buttonName) {
      var button = UI(buttonName);
      this.getAllButtons().forEach(this.deselectButton);
      button.classList.add('selected');
    }
  };

  PubSub.subscribe('tabRequested', function (tabId) {
    var buttonName = TopMenu.getButtonNameByTabId(tabId);
    if (buttonName) {
      TopMenu.selectButton(buttonName);
    }
  });
})(window, PubSub, UI);

/**
* @module SoundEffects
*/
(function (exports, PubSub) {
  'use strict';

  var SoundLibrary = {
      'button-click' : {
        mp3: 'audio/button-click.mp3'
      },
      'cheat-entered' : {
        mp3: 'audio/button-click-2.mp3'
      }
  };

  exports.getSoundEffect = function (effectName) {
    var effect = SoundLibrary[effectName];
    if (!effect) {
      throw new Error("Effect '" + effectName + "' is not in library");
    }
    // TODO: Choose format according to browser support
    // Not all browsers will support mp3
    return new Audio(effect.mp3);
  };

  PubSub.subscribe('controllerKeyPressed', function () {
    getSoundEffect('button-click').play();
  });

  PubSub.subscribe('cheatCodeEntered', function () {
    getSoundEffect('cheat-entered').play();
  });

})(window, PubSub);

/**
* @module CheatLogic
*/
(function (exports, PubSub) {

  // Succession of controller buttons pushed
  var cheatInput = '';

  // How rapidly (in ms) the player must push the buttons
  // for them to be counted as part of the same stream of input
  var pushFreq = 3000, 
      lastButtonPush;

  var Cheats = {
    'trianglecirclecircle' : {
      // Cheats become available over time, so a cheat that is 
      // available is not necessarily unlocked - and vice versa
      available: true, 
      unlocked: false,
      text: "Thai Food Dinner", 
      description: "Dinner plans"
    },

    'circlecirclesquare' : {
      available: true, 
      unlocked: false, 
      text: "Movies", 
      description: "Movie plans"
    }
  };

  exports.getCheats = function () {
    return Cheats;
  };

  PubSub.subscribe('cheatCodeEntered', function (cheat, allCheats, code) {
    Cheats[code].unlocked = true;
    // Reset the input stream
    cheatInput = '';
  });

  PubSub.subscribe('controllerKeyPressed', function (type) {
    var now = (new Date).getTime(); 

    // If a given amount of time has passed between button pushes
    // don't count the pushes as part of the same string. Instead, 
    // reset the string of cheat input
    if (typeof lastButtonPush === 'number' && now - lastButtonPush >= pushFreq) {
      cheatInput = '';
    }

    lastButtonPush = now;
    cheatInput+= type;

    // See if the input stream of cheats matches any cheats that are still locked
    for (var cheatCode in Cheats) {
      if (cheatInput.indexOf(cheatCode) != -1 && Cheats[cheatCode].unlocked === false) {
        PubSub.publish('cheatCodeEntered', Cheats[cheatCode], getCheats(), cheatCode);
      }
    }
  });

})(window, PubSub);

/**
* @module PowerUpIndicator
*/
(function (exports, PubSub, UI) {

  // TODO: Refactor make this more module-like

  PubSub.subscribe('cheatCodeEntered', function (cheatEntered, allCheats) {
    var indicator = UI('.power-up-indicator'),
        textProp = ('textContent' in indicator) ? 'textContent' : 'innerText';

    var totalUnlocked = 0;
    for (var code in allCheats) {
      if (allCheats[code].unlocked === true) {
        ++totalUnlocked;
      }
    }

    if (totalUnlocked > 0) {
      indicator.classList.add('power-up-unlocked');
    } else {
      indicator.classList.remove('power-up-unlocked'); 
    }

    indicator[textProp] = totalUnlocked;
  });

})(window, PubSub, UI);

/** 
* @module ButtonPressIndicator
*/
(function (exports, PubSub, UI) {
  'use strict';

  exports.ButtonPressIndicator = function (rootElem, type) {
    // Create a PlayStation-like button based on the sprite
    var button = document.createElement('div');
    button.className = 'controller-button sprite button-' + type;
    rootElem.appendChild(button);

    window.setTimeout(function () {
      rootElem.removeChild(button);
    }, 10000);
  };

  PubSub.subscribe('controllerKeyPressed', function (type) {
    new ButtonPressIndicator(UI('#root'), type);
  });

})(window, PubSub, UI);

/** 
* @module Router 
*/
(function (exports, PubSub, UI) {

  var Router = exports.Router = {
    getCurrentHash: function () {
      return (document.location.hash || '').replace('#','');
    },

    handleUrlChange: function () {
      var validTabs = ['controller','power-ups'];
      var tabId = Router.getCurrentHash();

      // Fall back to default tab if hash is missing or invalid
      if (validTabs.indexOf(tabId) === -1) {
        tabId = 'controller';
      }

      PubSub.publish('tabRequested', tabId);
    }
  };

  window.addEventListener('load', function () {
    Router.handleUrlChange();
  });
  window.addEventListener('hashchange', Router.handleUrlChange);

})(window, PubSub, UI);

/**
* @module LayoutManager
*/
(function (exports, PubSub, UI) {

  var TabsList = [
    '#controller',
    '#power-ups'
  ];

  var LayoutManager = exports.LayoutManager = {
    isValidTab: function (tabId) {
      return TabsList.indexOf(tabId) !== -1;
    }, 

    getAllTabs: function () {
      var tabs = UI('.tab-section');

      // A rudimentary check
      var resultIsArray = (typeof tabs === 'object' && tabs.hasOwnProperty('length'));
      return resultIsArray ? tabs : [];
    },

    hideTab: function (tab) {
      tab.classList.remove('tab-active');
    },

    showTab: function (tabId) {
      var tab;
      tabId = '#' + tabId; 

      if (this.isValidTab(tabId)) {
        tab = UI(tabId);
      } else {
        tab = UI('#controller');
      }
      this.getAllTabs().forEach(LayoutManager.hideTab);
      tab.classList.add('tab-active'); 
    }
  };

  PubSub.subscribe('tabRequested', function (tabId) {
    LayoutManager.showTab(tabId);
  });

  PubSub.subscribe('topMenuButtonPressed', function (button) {
    PubSub.publish('tabReqested', button);
  });

})(window, PubSub, UI);




