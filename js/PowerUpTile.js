/**
* @Module PowerUpTile 
*/
(function (exports, PubSub, UI, CheatLogic, rateLimit) {

  // DOM element containing all power-up tiles
  var tiles = UI("#power-up-tile-wrapper"),
      temp = UI("#temp-power-up-row");
  var showPowerups = rateLimit(showAvailablePowerups, 1000);

  function showAvailablePowerups () {
    var template = Handlebars.compile(temp.innerHTML),
    html = template({cheats: CheatLogic.getCheats()});
    tiles.innerHTML = html;
  }

  PubSub.subscribe('tabWillLoad', function (tab) {
    if (tab === 'power-ups') {
      showPowerups();
    }
  });

})(window, PubSub, UI, CheatLogic, rateLimit);