/**
* @module CheatLogic
*/
(function (exports, PubSub, rateLimit) {

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
    image: 'http://www.codyromano.com/qu/read-only-98443_640.png'
  });

  Cheats = Cheats.map(cheat => {
    cheat.id = cheat.code.join('-');
    return cheat;
  });

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

        const cheatId = c.code.join('-');
        PubSub.publish('cheatCodeUnlocked', cheatId);
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

  /**
  * Quickly demo the app by specifying a time after which
  * all items should become unlocked. 
  */
  PubSub.subscribe('simulationWillStart', function (secondsPerCheat) {

    secondsPerCheat = secondsPerCheat || 10;

    // Reset all cheats to unlocked status 
    Cheats = Cheats.map(function (cheat) {
      cheat.unlocked = false; 
      return cheat;
    });

    // Show the subsequent cheats at a defined interval of seconds
    Cheats = Cheats.map(function (cheat, index) {
      var date = new Date(),
          currentSeconds = date.getSeconds(),
          offset = secondsPerCheat + (secondsPerCheat * index);

        date.setSeconds(currentSeconds + offset);
        cheat.dateAvailable = date;
        return cheat;
    });

    broadcastNextCheat();
  });

  PubSub.subscribe('cheatCodeUnlocked', id => {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
    } else {
      console.error(`Cannot find cheat row with ID ${id}`);
    }
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

    if (typeof next !== 'object') {
      return false;
    }
    if ((date = new Date(next.dateAvailable)) == 'Invalid Date') {
      return false;
    }

    PubSub.publish('cheatWillBecomeAvailable', date);
  }

  PubSub.subscribe('tabRequested', broadcastNextCheat);
  PubSub.subscribe('timerCompleted', broadcastNextCheat);

})(window, PubSub, rateLimit);