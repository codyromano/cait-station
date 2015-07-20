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

        if (callbacks[eventName]) {
          callbacks[eventName].forEach(function (cb) {
            cb.apply(undefined, args);
          });
        } else {
          console.warn("No modules are listening to the event '%s'", eventName);
        }
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
        mp3: 'http://www.codyromano.com/qu/button-click.mp3'
      },
      'cheat-entered' : {
        mp3: 'http://www.codyromano.com/qu/button-click-2.mp3'
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


  var isAvailable = function () {
    var current = new Date(),
        itemDate = new Date(this.dateAvailable);
        //diff = (now - itemDate) / 86400000; // Seconds in a day

    var avail = Date.now() >= itemDate;
    return avail;
  };

  function preloadImage (cheatObj) {
    var image = document.createElement('img');
    image.src = cheatObj.image;
  }

  // TODO: Should be part of sprite. Also, it should be smaller
  preloadImage({
    image: 'https://pixabay.com/static/uploads/photo/2013/04/01/09/02/read-only-98443_640.png'
  });

  var Cheats = [
    {
      code: ["triangle","circle","circle"],
      unlocked: false,
      dateAvailable: "July 20, 2015 9:00:00",
      title: "Spice Attack",
      image: "https://cdn2.vox-cdn.com/uploads/chorus_image/image/46057904/upload.0.0.0.jpg",
      description: "Dinner at Revel restaurant, WA"
    },
    {
      code: ["triangle","circle","circle"],
      unlocked: false,
      dateAvailable: "July 20, 2015 11:00:00",
      title: "Double Punch",
      image: "https://cdn2.vox-cdn.com/uploads/chorus_image/image/46057904/upload.0.0.0.jpg",
      description: "Dinner at Revel restaurant, WA"
    },
    {
      code: ["triangle","square","circle"],
      unlocked: false,
      dateAvailable: "July 20, 2015 13:00:00",
      title: "Super Smash",
      image: "https://cdn2.vox-cdn.com/uploads/chorus_image/image/46057904/upload.0.0.0.jpg",
      description: "Dinner at Revel restaurant, WA"
    }
  ];

  // Add a helper method to all the cheat objects
  Cheats = Cheats.map(function (cheat) {
    cheat.isAvailable = isAvailable;
    return cheat;
  });

  CheatLogic.getTotalUnlocked = function () {
    return Cheats.filter(function (cheat) {
      return (cheat.unlocked === true);
    }).length;
  };

  CheatLogic.getNextAvailable = function () {
    var next = Cheats.filter(function (cheat) {
      return cheat.isAvailable() === false;
    }).sort(function (a, b) {
      var aTime = new Date(a.dateAvailable).getTime(),
          bTime = new Date(b.dateAvailable).getTime();

      if (aTime === bTime) {
        return 0;
      }

      return aTime > bTime ? 1 : -1;
    });
    return next[0];
  };

  CheatLogic.getCheats = function () {
    return Cheats;
  };

  CheatLogic.unlock = function (title) {
    Cheats = Cheats.map(function (c) {
      if (c.title === title) {
        c.unlocked = true;
        preloadImage(c);
      }
      return c;
    });
  };

  CheatLogic.getCheatFromInput = function (inputStr) {

    var matchingCheats = Cheats.filter(function (cheat) {
      // Find cheats that are available but haven't been unlocked
      return cheat.isAvailable() && cheat.unlocked === false;

      // Make sure the cheat code matches the input string
    }).filter(function (cheat) {
      var codeStr = cheat.code.join('');
      return inputStr.indexOf(codeStr) != -1;
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

  function broadcastNextCheat () {
    var next = CheatLogic.getNextAvailable();
    var date;

    if (next) {
      // Let the timer know a new cheat will become available
      date = new Date(next.dateAvailable);
      PubSub.publish('cheatWillBecomeAvailable', date);
    }
  }

  PubSub.subscribe('tabRequested', broadcastNextCheat);
  PubSub.subscribe('timerCompleted', broadcastNextCheat);

})(window, PubSub);

/**
* @module CheatRows
*/
(function (exports, PubSub, CheatLogic, UI) {
  'use strict';

  var cheatRowsWrapper = UI('#cheat-rows-wrapper'),
      cheatRowTemp = UI('#temp-cheat-row');

  function showAvailableCheats () {
    var available = CheatLogic.getCheats().filter(function (cheat) {
      return cheat.isAvailable();
    });

    var template = Handlebars.compile(cheatRowTemp.innerHTML),
        html = template({cheats: available});

    cheatRowsWrapper.innerHTML = html;
  }

  PubSub.subscribe('tabWillLoad', showAvailableCheats);
  PubSub.subscribe('timerCompleted', showAvailableCheats);
  PubSub.subscribe('cheatWillBecomeAvailable', showAvailableCheats);

})(window, PubSub, CheatLogic, UI);

/**
* @module Timer
*/
(function (exports, PubSub, UI) {

  'use strict';

  var timerElem = UI('.timer');
  var timerHeading = UI('.timer-heading');

  var timer = exports.Timer = new Timer({
    endDate: new Date(), 
    updateFreq: 1000,
    onUpdate: function (days, hours, minutes, seconds) {

      if (seconds === 60) {
        seconds = 59;
      }
      if (minutes === 60) {
        minutes = 59;
      }

      var timeLeft = [hours, minutes, seconds].join(':');
      var titleDisplay;

      timerHeading.innerHTML = 'A new cheat will appear in...';
      timerElem.innerHTML = timeLeft;

      document.title = [hours, minutes].join(':') + " until next cheat";
    },
    onComplete: function () {
      PubSub.publish('timerCompleted');
      timerElem.innerHTML = '';
      timerHeading.innerHTML = '';
    }
  });

  function Timer (props) {
    var isCounting = false;
    var _self = this;
    var now = new Date();

    this.endDate = props.endDate;
    this.onUpdate = props.onUpdate || function () {}; 
    this.updateFreq = props.updateFreq || 100;
    this.onComplete = props.onComplete || function () {};

    this.formatNumber = function (num) {
      var numAsString = ('' + num); 
      if (numAsString.length < 2) {
        numAsString = '0' + numAsString; 
      }
      return numAsString;
    };

    // Advance the timer by a given number of seconds, minutes or hours
    // This is most useful for testing
    this.advanceEndDate = function (value, unitType) {
      var now = new Date();

      if (['seconds','minutes','hours'].indexOf(unitType) === -1) {
        throw new Error('Invalid unit type. Expecting seconds, minutes or hours.');
      }

      if (value < 0) {
        throw new Error('The value by which you advance the end date must be positive.');
      }

      // Capitalize the string
      unitType = unitType.charAt(0).toUpperCase() + unitType.slice(1);

      var currentDateValue = now['get' + unitType]();
      now['set' + unitType]( currentDateValue + value);

      if (now == 'Invalid Date') {
        throw new Error('The date associated with your request is invalid.');
      }

      this.endDate = now;
      console.log('Adjusted date by %s %s. New date: %s', value, 
        unitType, this.endDate.toString());
    };

    this.timeDiff = function (dateStr1, dateStr2) {

      // Second argument defaults to current date
      dateStr2 = dateStr2 || new Date();

      // For flexibility, allow date to be provided as a string or object
      var date1 = (typeof dateStr1 === 'string') ? new Date(dateStr1) : dateStr1;
      var date2 = (typeof dateStr2 === 'string') ? new Date(dateStr2) : dateStr2;
      var msDiff, hour, minute, second;

      if (date1 == 'Invalid Date' || date2 == 'Invalid Date') {
        throw new Error('Invalid date(s)');
      }

      // Calculate time different in various increments
      msDiff = date1.getTime() - date2.getTime();
      hour = msDiff / 3600000;
      minute = msDiff / 60000;
      second = msDiff / 1000;

      // For display purposes, if there's a large number of hours,
      // minutes or seconds, cap the value. For example, it's not very
      // helpful to see 100+ hours when dates are one week apart.
      if (hour >= 12) {
        hour = 24 - date2.getHours();
      }
      if (minute >= 60) {
        minute = 60 - date2.getMinutes();
      }
      if (second >= 60) {
        second = 60 - date2.getSeconds();
      }

      // Also for display purposes, don't allow the value to 
      // drop below zero 
      if (hour < 0) {
        hour = 0;
      }
      if (minute < 0) {
        minute = 0; 
      }
      if (second < 0) {
        second = 0;
      }

      return {
        hours: Math.floor(hour),
        minutes: Math.floor(minute),
        seconds: Math.floor(second)
      };
    }

    function updateCycle () {
      now = new Date();

      if (!_self.endDate) {
        return;
      }

      var diff = _self.timeDiff(_self.endDate);

      _self.onUpdate(
        null,
        _self.formatNumber(diff.hours),
        _self.formatNumber(diff.minutes), 
        _self.formatNumber(diff.seconds)
      );

      if (diff.hours === 0 && diff.minutes === 0 && diff.seconds === 0) {
        _self.stop();
        _self.onComplete();
        return false;
      }

      if (isCounting) {
        window.setTimeout(updateCycle, _self.updateFreq);
      }
    }

    this.stop = function () {
      isCounting = false;
    };

    this.start = function () {
      var diff; 

      // Can't start the timer if it's already running
      if (isCounting) {
        return false;
      }

      isCounting = true; 
      updateCycle();
    };
  }

  PubSub.subscribe('godMode', function () {
    timer.stop();

    if (typeof timerElem === 'object' && 'innerHTML' in timerElem) {
      timerElem.innerHTML = 'Infinity';
    }
  });

  PubSub.subscribe('cheatWillBecomeAvailable', function (date) {
    timer.endDate = date; 
    timer.start();
  });

})(window, PubSub, UI);

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

  PubSub.subscribe('godMode', function () {
    PowerUpIndicator.setCounter(1000000);
  });

})(window, PubSub, UI, CheatLogic);

/**
* @Module PowerUpTile 
*/
(function (exports, PubSub, UI, CheatLogic) {

  // DOM element containing all power-up tiles
  var tiles = UI("#power-up-tile-wrapper"),
      temp = UI("#temp-power-up-row");

  function showAvailablePowerups () {
    var template = Handlebars.compile(temp.innerHTML),
    html = template({cheats: CheatLogic.getCheats()});
    tiles.innerHTML = html;
  }

  PubSub.subscribe('tabWillLoad', function (tab) {
    if (tab === 'power-ups') {
      showAvailablePowerups();
    }
  });

})(window, PubSub, UI, CheatLogic);

/** 
* @module ButtonPressIndicator
*/
(function (exports, PubSub, UI) {
  'use strict';

  var rootElem = UI('#root');
  var buttons = []; 

  exports.ButtonPressIndicator = function (rootElem, type) {
    var _self = this;
    // Create a PlayStation-like button based on the sprite
    this.button = document.createElement('div');
    this.button.className = 'controller-button sprite button-' + type;
    rootElem.appendChild(this.button);

    window.setTimeout(function () {
      rootElem.removeChild(_self.button);
    }, 10000);
  };

  PubSub.subscribe('tabWillLoad', function () {
    buttons.forEach(function (buttonObj) {
      buttonObj.button.style.display = 'none';
    });
  });

  PubSub.subscribe('controllerKeyPressed', function (type) {
    buttons.push(new ButtonPressIndicator(rootElem, type));
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

PubSub.subscribe('ticTacToe', function () {
  (function TicTacToe (limit, buttonType) {
    var nextKey = buttonType === 'x' ? 'circle' : 'x';

    (limit > 0 && PubSub.publish('controllerKeyPressed', nextKey))
    limit--;
    window.setTimeout(TicTacToe.bind(undefined, limit, nextKey), 250);
  })(10);
});

PubSub.subscribe('godMode', function () {
  var h1 = UI('#primary-heading'),
      textProp = ('textContent' in h1) ? 'textContent' : 'innerText';

  h1[textProp] = 'Control the heavens...';
});

PubSub.subscribe('8bitMode', function () {
  var iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/wCkwb_rOg7M?rel=0&autoplay=1';
  iframe.style.position = 'absolute';
  iframe.style.top = '50%';
  iframe.style.left = '50%';
  document.querySelector('body').appendChild(iframe);
});


