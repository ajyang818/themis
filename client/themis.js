// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Lists = new Meteor.Collection("lists");
Todos = new Meteor.Collection("todos");

// ID of currently selected list
Session.setDefault('list_ids', null);
Session.setDefault('customListIds', null);
Session.setDefault('centeredDate', null);

// When editing a list name, ID of the list
Session.setDefault('editing_listname', null);

// When editing todo text, ID of the todo
Session.setDefault('editing_itemname', null);

Session.setDefault('topRowType', "me");
Session.setDefault('midRowType', "work");
Session.setDefault('botRowType', "custom");
Session.setDefault('topRowProps', {'type': Session.get('topRowType')});
Session.setDefault('midRowProps', {'type': Session.get('midRowType')});
Session.setDefault('botRowProps', {'type': Session.get('botRowType')});




////////// Startup //////////

var TodosRouter = Backbone.Router.extend({
  routes: {
    ":list_id": "main"
  },
  main: function (list_id) {
    // Here's where we used to calculate the list ids to show
  },
  setList: function (list_id) {
    this.navigate(list_id, true);
  }
});

Router = new TodosRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
var listsHandle = Meteor.subscribe('lists', function () {

  // First, grab the customLists we want to show...
  var customLists = Lists.find({date_list: false}),
      customListIds = [];

  customLists.forEach(function (customListToShow) {
    customListIds.push(customListToShow._id);
  });

  Session.set("customListIds", customListIds);

  // Then, recenter the date lists around today
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  recenterDateWindow(today);
  // This sets both Session variables list_ids and centeredDate

});

var todosHandle = null;
// Always be subscribed to the todos for the selected list.
Deps.autorun(function () {
  var list_ids = Session.get('list_ids');
  if (list_ids) {
    todosHandle = Meteor.subscribe('todos', list_ids);
  } else
    todosHandle = null;
});




////////// Screen //////////

Template.screen.events({
  'click #move-dates-left': function () {
    var oldDate = Session.get('centeredDate'),
        newDate = new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate() - 1);

    recenterDateWindow(newDate);
  },

  'click #move-dates-right': function () {
    var oldDate = Session.get('centeredDate'),
        newDate = new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate() + 1);

    recenterDateWindow(newDate);
  }
});





////////// Lists //////////

// Template Logic

Template.rowCreator.loading = function () {
  return !listsHandle.ready();
};

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.rowCreator.events(okCancelEvents(
  '#new-list',
  {
    ok: function (text, evt) {
      newListId = Lists.insert({
        name: text,
        date_list: false
      });

      var customListIds = Session.get('customListIds'),
          allListIds = Session.get('list_ids');
      customListIds.splice(customListIds.indexOf(null), 0, newListId);
      debugger;
      var foundNull = false;
      for (ind = 0; ind < customListIds.length; ind++) {
        if (!foundNull && customListIds[ind] === null) {
          foundNull = true;
        } else if (foundNull && customListIds[ind] === null && ind > 3) {
          customListIds = customListIds.slice(0, ind);
        }
      }

      allListIds.push(newListId);

      Session.set('customListIds', customListIds);
      Session.set('list_ids', allListIds);
      evt.target.value = "";
    }
  }));

Template.rowCreator.events(okCancelEvents(
  '#list-name-input',
  {
    ok: function (value) {
      Lists.update(this._id, {$set: {name: value}});
      Session.set('editing_listname', null);
    },
    cancel: function () {
      Session.set('editing_listname', null);
    }
  }));




////////// Panels + Lists //////////

// Template Logic

Template.rowCreator.all_panels = function () {
  // Returns the set of all panels that are going to be shown
  // Should be divided into top, bottom

  var today = new Date();
  var dateSlug = moment(today).format("YYYYMMDD");

  var todaysList = Lists.findOne({date_list: true, slug: dateSlug});
  var list_ids = Session.get('list_ids');

  if (!(todaysList)) {
    return {};
  }

  var customListsToShow = Session.get('customListIds').slice(0, 3);

  if (customListsToShow.length < 4) {
    var startLength = customListsToShow.length;
    for (ind = 0; ind < (4 - startLength); ind++) {
      customListsToShow.push(null);
    }
  }

  var returnArray = {
    'top': [list_ids[0], list_ids[1], list_ids[2], list_ids[3]],
    'middle': [list_ids[0], list_ids[1], list_ids[2], list_ids[3]],
    'bottom': customListsToShow
  };

  Session.set('customListIds', customListsToShow);

  return returnArray;
};

Template.top_indiv_list.listProps = function() {
  return Session.get('topRowProps');
};

Template.top_indiv_list.this_list = function() {
  return Lists.findOne({_id: this.toString()});
};

Template.top_indiv_list.todos = function () {
  // Given a list_id, returns the Todos of that list
  return Todos.find({list_id: this.toString(), type: Session.get('topRowType')});
};

Template.top_indiv_list.loading = function () {
  // return todosHandle && !todosHandle.ready();
  return false;
};

// Events

Template.top_indiv_list.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      var thisList = Lists.findOne({_id: this.toString()});
      Todos.insert({
        text: text,
        done: false,
        list_id: thisList._id,
        timestamp: (new Date()).getTime(),
        type: Session.get('topRowType')
      });
      evt.target.value = '';
    }
  }));

/////////// Middle Row

Template.mid_indiv_list.this_list = function() {
  return Lists.findOne({_id: this.toString()});
};

Template.mid_indiv_list.todos = function () {
  // Given a list_id, returns the Todos of that list
  return Todos.find({list_id: this.toString(), type: Session.get('midRowType')});
};

Template.mid_indiv_list.loading = function () {
  // return todosHandle && !todosHandle.ready();
  return false;
};

// Events

Template.mid_indiv_list.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      var thisList = Lists.findOne({_id: this.toString()});
      Todos.insert({
        text: text,
        done: false,
        list_id: thisList._id,
        timestamp: (new Date()).getTime(),
        type: Session.get('midRowType')
      });
      evt.target.value = '';
    }
  }));

/////////// Bottom Row

Template.bot_indiv_list.this_list = function() {
  return Lists.findOne({_id: this.toString()});
};

Template.bot_indiv_list.todos = function () {
  // Given a list_id, returns the Todos of that list
  return Todos.find({list_id: this.toString(), type: Session.get('botRowType')});
};

Template.bot_indiv_list.loading = function () {
  // return todosHandle && !todosHandle.ready();
  return false;
};

// Events

Template.bot_indiv_list.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      var thisList = Lists.findOne({_id: this.toString()});
      Todos.insert({
        text: text,
        done: false,
        list_id: thisList._id,
        timestamp: (new Date()).getTime(),
        type: Session.get('botRowType')
      });
      evt.target.value = '';
    }
  }));




////////// Todo Items //////////

// Template Logic

Template.todo_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.todo_item.isDone = function () {
  return this.done;
};

Template.todo_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

// Events

Template.todo_item.events({
  'click .check': function () {
    Todos.update(this._id, {$set: {done: !this.done}});
  },

  'click .destroy': function () {
    Todos.remove(this._id);
  },


  'dblclick .display .todo-text': function (evt, tmpl) {
    Session.set('editing_itemname', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#todo-input"));
  },

});

Template.todo_item.events(okCancelEvents(
  '#todo-input',
  {
    ok: function (value) {
      Todos.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  }));
