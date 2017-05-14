/**
* @module CheatRows
*/
(function (exports, PubSub, CheatLogic, UI, rateLimit) {
  'use strict';

  var cheatRowsWrapper = UI('#cheat-rows-wrapper'),
      cheatRowTemp = UI('#temp-cheat-row'),
      showCheats = rateLimit(showAvailableCheats, 2000);

  function showAvailableCheats () {
    var available = CheatLogic.getCheats().filter(function (cheat) {
      return cheat.isAvailable();
    });

    var template = Handlebars.compile(cheatRowTemp.innerHTML),
        html = template({cheats: available});

    cheatRowsWrapper.innerHTML = html;
  }

  PubSub.subscribe('tabWillLoad', showCheats);
  PubSub.subscribe('timerCompleted', showCheats);
  PubSub.subscribe('cheatWillBecomeAvailable', showCheats);

})(window, PubSub, CheatLogic, UI, rateLimit);
