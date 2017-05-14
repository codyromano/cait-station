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