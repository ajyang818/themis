////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".

if (Meteor.isClient) {
  Handlebars.registerHelper('topRowProps',function(input){
    return Session.get("topRowProps");
  });
  Handlebars.registerHelper('botRowProps',function(input){
    return Session.get("botRowProps");
  });
}

okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

activateInput = function (input) {
  input.focus();
  input.select();
};

findDateWindow = function (focus_date) {
  var totalPanes = 4,  // HARD-CODE
      startBack = 0;  // HARD-CODE

  var dateSlugs = [];
  for (var ind = 0; ind < totalPanes; ind++) {
    var thisDate = new Date(focus_date.getFullYear(), focus_date.getMonth(), focus_date.getDate() + (startBack + ind));
    dateSlugs.push(moment(thisDate).format("YYYYMMDD"));
  }
  return dateSlugs;
};
