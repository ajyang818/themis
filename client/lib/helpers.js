////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".

if (Meteor.isClient) {
  Handlebars.registerHelper('topRowProps',function(input){
    return Session.get("topRowProps");
  });
  Handlebars.registerHelper('midRowProps',function(input){
    return Session.get("midRowProps");
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

findDateWindow = function (focusDate) {
  // Takes the focusDate and returns the slugs of the dates in a range around it
  const totalPanes = 4,  // HARD-CODE
        startBack = 0;  // HARD-CODE

  var dateSlugs = [];
  for (var ind = 0; ind < totalPanes; ind++) {
    var thisDate = new Date(focusDate.getFullYear(), focusDate.getMonth(), focusDate.getDate() + (startBack + ind));
    dateSlugs.push(moment(thisDate).format("YYYYMMDD"));
  }
  return dateSlugs;
};

createDateListRange = function(focusDate) {
  // Takes the focusDate and creates the date-based lists within a window of that date
  const daysBehindToCreate = -1,
        daysAheadToCreate = 7;  // Constant

  for (var ind = daysBehindToCreate; ind <= daysAheadToCreate; ind++) {
    var dateToCheck = new Date(focusDate.getFullYear(), focusDate.getMonth(), focusDate.getDate() + ind);
    var dateSlug = moment(dateToCheck).format("YYYYMMDD");

    if (!(Lists.find({date_list: true, slug: dateSlug}).count())) {
      Lists.insert({
        name: moment(dateToCheck).format("ddd - MMM D, YYYY"),
        date_list: true,
        slug: dateSlug,
      });
    }
  }
};

recenterDateWindow = function(focusDate) {
  // Takes the focusDate, makes sure date lists around it are created, and then recenters the
  // global Session variable list_ids to be around the focusDate
  var slugsToFind = findDateWindow(focusDate),
      listsToShow = [],
      customListIds = Session.get('customListIds'),
      listIdsToShow = [];

  createDateListRange(focusDate);
  // var listsToShow = Lists.find({slug: {$in: slugsToFind}}),

  slugsToFind.forEach(function (slugToFind) {
    listsToShow.push(Lists.findOne({slug: slugToFind}));
  })

  listsToShow.forEach(function (listToShow) {
    listIdsToShow.push(listToShow._id);
  });

  listIdsToShow.push.apply(listIdsToShow, customListIds);

  Session.set("list_ids", listIdsToShow);
  Session.set("centeredDate", focusDate);

}
