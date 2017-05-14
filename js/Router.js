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

      if (tabId === "simulationWillStart") {
        PubSub.publish('simulationWillStart', 10);
      }

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