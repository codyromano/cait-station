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