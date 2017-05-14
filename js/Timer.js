/**
* @module Timer
*/
(function (exports, PubSub, UI) {
  'use strict';

  var timerElem = UI('.timer');
  var timerHeading = UI('.timer-heading');

  var timer = exports.Timer = new Timer({
    endDate: new Date(), 
    updateFreq: 1000,
    onUpdate: function (days, hours, minutes, seconds) {

      if (seconds === 60) {
        seconds = 59;
      }
      if (minutes === 60) {
        minutes = 59;
      }

      var timeLeft = [hours, minutes, seconds].join(':');
      var titleDisplay;

      timerHeading.innerHTML = 'A new cheat will appear in...';
      timerElem.innerHTML = timeLeft;

      document.title = [hours, minutes].join(':') + " until next cheat";
    },
    onComplete: function () {
      PubSub.publish('timerCompleted');
      timerElem.innerHTML = '';
      timerHeading.innerHTML = '';
    }
  });

  function Timer (props) {
    var isCounting = false;
    var _self = this;
    var now = new Date();

    this.endDate = props.endDate;
    this.onUpdate = props.onUpdate || function () {}; 
    this.updateFreq = props.updateFreq || 100;
    this.onComplete = props.onComplete || function () {};

    this.formatNumber = function (num) {
      var numAsString = ('' + num); 
      if (numAsString.length < 2) {
        numAsString = '0' + numAsString; 
      }
      return numAsString;
    };

    // Advance the timer by a given number of seconds, minutes or hours
    // This is most useful for testing
    this.advanceEndDate = function (value, unitType) {
      var now = new Date();

      if (['seconds','minutes','hours'].indexOf(unitType) === -1) {
        throw new Error('Invalid unit type. Expecting seconds, minutes or hours.');
      }

      if (value < 0) {
        throw new Error('The value by which you advance the end date must be positive.');
      }

      // Capitalize the string
      unitType = unitType.charAt(0).toUpperCase() + unitType.slice(1);

      var currentDateValue = now['get' + unitType]();
      now['set' + unitType]( currentDateValue + value);

      if (now == 'Invalid Date') {
        throw new Error('The date associated with your request is invalid.');
      }

      this.endDate = now;
      console.log('Adjusted date by %s %s. New date: %s', value, 
        unitType, this.endDate.toString());
    };

    this.timeDiff = function (dateStr1, dateStr2) {

      // Second argument defaults to current date
      dateStr2 = dateStr2 || new Date();

      // For flexibility, allow date to be provided as a string or object
      var date1 = (typeof dateStr1 === 'string') ? new Date(dateStr1) : dateStr1;
      var date2 = (typeof dateStr2 === 'string') ? new Date(dateStr2) : dateStr2;
      var msDiff, hour, minute, second;

      if (date1 == 'Invalid Date' || date2 == 'Invalid Date') {
        throw new Error('Invalid date(s)');
      }

      // Calculate time different in various increments
      msDiff = date1.getTime() - date2.getTime();
      hour = msDiff / 3600000;
      minute = msDiff / 60000;
      second = msDiff / 1000;

      if (minute >= 60) {
        minute = 60 - date2.getMinutes();
      }
      if (second >= 60) {
        second = 60 - date2.getSeconds();
      }

      // Also for display purposes, don't allow the value to 
      // drop below zero 
      if (hour < 0) {
        hour = 0;
      }
      if (minute < 0) {
        minute = 0; 
      }
      if (second < 0) {
        second = 0;
      }

      return {
        hours: Math.floor(hour),
        minutes: Math.floor(minute),
        seconds: Math.floor(second)
      };
    }

    function updateCycle () {
      now = new Date();

      if (!_self.endDate) {
        return;
      }

      var diff = _self.timeDiff(_self.endDate);

      _self.onUpdate(
        null,
        _self.formatNumber(diff.hours),
        _self.formatNumber(diff.minutes), 
        _self.formatNumber(diff.seconds)
      );

      if (diff.hours === 0 && diff.minutes === 0 && diff.seconds === 0) {
        _self.stop();
        _self.onComplete();
        return false;
      }

      if (isCounting) {
        window.setTimeout(updateCycle, _self.updateFreq);
      }
    }

    this.stop = function () {
      isCounting = false;
    };

    this.start = function () {
      var diff; 

      // Can't start the timer if it's already running
      if (isCounting) {
        return false;
      }

      isCounting = true; 
      updateCycle();
    };
  }

  PubSub.subscribe('godMode', function () {
    timer.stop();

    if (typeof timerElem === 'object' && 'innerHTML' in timerElem) {
      timerElem.innerHTML = 'Infinity';
    }
  });

  PubSub.subscribe('cheatWillBecomeAvailable', function (date) {
    timer.endDate = date; 
    window.setTimeout(function () {
      timer.start();
    }, 2000);
  });

})(window, PubSub, UI);