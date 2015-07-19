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

  var CheatLogic = exports.CheatLogic = {};

  // Succession of controller buttons pushed
  var cheatInput = '';

  // How rapidly (in ms) the player must push the buttons
  // for them to be counted as part of the same stream of input
  var pushFreq = 3000, 
      lastButtonPush;

  var Cheats = [
    {
      code: ["triangle","circle","circle"],
      unlocked: false, 
      available: true,
      dateAvailable: "July 24, 2015 12:00:00",
      title: "Spice Attack",
      description: "Dinner at Revel restaurant, WA"
    },
    {
      code: ["circle","circle","square"],
      unlocked: false, 
      available: true,
      dateAvailable: "July 24, 2015 12:00:00",
      title: "Epic Sports",
      description: "Testing"
    }
  ];

  CheatLogic.getTotalUnlocked = function () {
    return Cheats.filter(function (cheat) {
      return (cheat.unlocked === true);
    }).length;
  };

  CheatLogic.getCheats = function () {
    return Cheats;
  };

  CheatLogic.unlock = function (title) {
    Cheats = Cheats.map(function (c) {
      if (c.title === title) {
        c.unlocked = true;
      }
      return c;
    });
  };

  CheatLogic.getCheatFromInput = function (inputStr) {
    var matchingCheats = Cheats.filter(function (cheat) {
      var codeStr = cheat.code.join('');
      return (inputStr.indexOf(codeStr) != -1 && cheat.unlocked === false);
    });

    return (matchingCheats.length > 0) ? matchingCheats[0] : false;
  };

  PubSub.subscribe('cheatCodeEntered', function (cheat, allCheats, code) {

    CheatLogic.unlock(cheat.title);

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

    var cheat = CheatLogic.getCheatFromInput(cheatInput)

    if (typeof cheat === 'object') {
      PubSub.publish('cheatCodeEntered', cheat, 
        CheatLogic.getCheats(), cheat.code.join(''));
    }
  });

})(window, PubSub);

/**
* @module CheatRows
*/
(function (exports, PubSub, CheatLogic, UI) {
  'use strict';

  var cheatRowsWrapper = UI('#cheat-rows-wrapper'),
      cheatRowTemp = UI('#temp-cheat-row');

  function isAvailable (cheat) {
    return cheat.available === true;
  }

  function showAvailableCheats () {
    var available = CheatLogic.getCheats().filter(isAvailable),
        template = Handlebars.compile(cheatRowTemp.innerHTML),
        html = template({cheats: available});

    cheatRowsWrapper.innerHTML = html;
  }

  PubSub.subscribe('tabWillLoad', function (tab) {
    showAvailableCheats();
  });

})(window, PubSub, CheatLogic, UI);

/**
* @module PowerUpIndicator
*/
(function (exports, PubSub, UI, CheatLogic) {
  'use strict';

  var PowerUpIndicator = exports.PowerUpIndicator = {};

  PowerUpIndicator.setCounter = function (totalUnlocked, domElem) {
    domElem = domElem || UI('.power-up-indicator');
    var textProp = ('textContent' in domElem) ? 'textContent' : 'innerText';

    if (totalUnlocked > 0) {
      domElem.classList.add('power-up-unlocked');
    } else {
      domElem.classList.remove('power-up-unlocked'); 
    }

    domElem[textProp] = totalUnlocked;
  };

  PubSub.subscribe('cheatCodeEntered', function (cheatEntered, allCheats) {
    var unlocked = CheatLogic.getTotalUnlocked();
    PowerUpIndicator.setCounter(unlocked);
  });

})(window, PubSub, UI, CheatLogic);

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
        // Revert to controller, the default tab
        tabId = '#controller';
        tab = UI('#controller');
      }

      PubSub.publish('tabWillLoad', tabId.replace('#',''));

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




