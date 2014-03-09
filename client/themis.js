// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Lists = new Meteor.Collection("lists");
Todos = new Meteor.Collection("todos");

// ID of currently selected list
Session.setDefault('list_id', null);

// When editing a list name, ID of the list
Session.setDefault('editing_listname', null);

// When editing todo text, ID of the todo
Session.setDefault('editing_itemname', null);




////////// Tracking selected list in URL //////////

var TodosRouter = Backbone.Router.extend({
  routes: {
    ":list_id": "main"
  },
  main: function (list_id) {
    var oldList = Session.get("list_id");
    if (oldList !== list_id) {
      Session.set("list_id", "msLZZBvp6ugyeSpoG");  // Hard-codes!!
      Session.set("list_id_bot", 'NQkynAC2jNgWiTgG9');
    }
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

  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Router.setList(list._id);
  }

  // Create new date-centered lists depending on the day
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  for (var ind = 0; ind <= 7; ind++) {

    var dateToCheck = new Date(today.getFullYear(), today.getMonth(), today.getDate() + ind);
    var dateSlug = moment(dateToCheck).format("YYYYMMDD");

    if (!(Lists.find({date_list: true, slug: dateSlug}).count())) {
      Lists.insert({
        name: moment(dateToCheck).format("ddd - MMM D, YYYY"),
        date_list: true,
        slug: dateSlug,
      });
    }
  }

});

var todosHandle = null;
// Always be subscribed to the todos for the selected list.
Deps.autorun(function () {
  var list_id = Session.get('list_id'),
      list_id_bot = Session.get('list_id_bot');
  if (list_id) {
    todosHandle = Meteor.subscribe('todos', [list_id, list_id_bot]);
    // todosHandleBot = Meteor.subscribe('todos', list_id_bot);
  } else
    todosHandle = null;
});




////////// Lists //////////

// Template Logic

Template.lists.loading = function () {
  return !listsHandle.ready();
};

Template.lists.lists = function () {
  return Lists.find({});
};

Template.lists.selected = function () {
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  return Session.equals('editing_listname', this._id);
};

// Events

Template.lists.events({
  'mousedown .list': function (evt) { // select list
    Router.setList(this._id);
  },
  'click .list': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick .list': function (evt, tmpl) { // start editing list name
    Session.set('editing_listname', this._id);
    Deps.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#list-name-input"));
  }
});

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events(okCancelEvents(
  '#new-list',
  {
    ok: function (text, evt) {
      var id = Lists.insert({name: text});
      Router.setList(id);
      evt.target.value = "";
    }
  }));

Template.lists.events(okCancelEvents(
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

Template.date_list_panels.all_panels = function () {
  // Returns the set of all panels that are going to be shown
  // Should be divided into top, bottom

  var today = new Date();
  var dateSlug = moment(today).format("YYYYMMDD");

  var todaysList = Lists.findOne({date_list: true, slug: dateSlug});

  if (!(todaysList)) {
    return {};
  } else {
    topArray = {
      'list_name': todaysList.name,
      'list_id': todaysList._id
    };
  }

  var list_id_top = Session.get('list_id'),
      list_id_bot = Session.get('list_id_bot');

  var returnArray = {
    'top': topArray,
    'bottom': {
      'list_name': 'Bottom List',
      'list_id': list_id_bot
    }
  };

  return returnArray;
};

Template.indiv_list.todos = function () {
  // Given a list_id, returns the Todos of that list
  return Todos.find({list_id: this.list_id});
};

Template.indiv_list.loading = function () {
  // return todosHandle && !todosHandle.ready();
  return false;
};

Template.indiv_list.any_list_selected = function () {
  // return !Session.equals('list_id', null);
  return true;
};

Template.indiv_list.list_id = function() {
  return this.list_id;
};

// Events

Template.indiv_list.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      Todos.insert({
        text: text,
        list_id: this.list_id,
        done: false,
        timestamp: (new Date()).getTime(),
        test: false
      });
      evt.target.value = '';
    }
  }));




////////// Todo Items //////////

// Template Logic

Template.todo_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.todo_item.done_checkbox = function () {
  return this.done ? 'checked="checked"' : '';
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
