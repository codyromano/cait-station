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
