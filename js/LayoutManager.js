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