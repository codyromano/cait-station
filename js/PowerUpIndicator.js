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