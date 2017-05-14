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