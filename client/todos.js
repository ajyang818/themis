// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Lists = new Meteor.Collection("lists");
Todos = new Meteor.Collection("todos");

DateLists = new Meteor.Collection('dateLists');
DateTodos = new Meteor.Collection('dateTodos');

// ID of currently selected list
Session.setDefault('list_id', null);

// When editing a list name, ID of the list
Session.setDefault('editing_listname', null);

// When editing todo text, ID of the todo
Session.setDefault('editing_itemname', null);

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
var listsHandle = Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Router.setList(list._id);
  }
});

var dateListsHandle = Meteor.subscribe('dateLists', function () {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  for (var ind = 0; ind <= 7; ind++) {
    var dateToCheck = new Date(today.getYear(), today.getMonth(), today.getDate() + ind);
    if (!(DateLists.find({date: dateToCheck}).count())) {
      DateLists.insert({
        date: dateToCheck,
        type: "life"
      });
      DateLists.insert({
        date: dateToCheck,
        type: "work"
      });
    }
  }
})

var todosHandle = null;
// Always be subscribed to the todos for the selected list.
Deps.autorun(function () {
  var list_id = Session.get('list_id'),
      list_id_bot = Session.get('list_id_bot');
  if (list_id) {
    todosHandle = Meteor.subscribe('todos', list_id);
    todosHandleBot = Meteor.subscribe('todos', list_id_bot);
  } else
    todosHandle = null;
});


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
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

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////// Lists //////////

Template.lists.loading = function () {
  return !listsHandle.ready();
};

Template.lists.lists = function () {
  return Lists.find({}, {sort: {name: 1}});
};

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

Template.lists.selected = function () {
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  return Session.equals('editing_listname', this._id);
};

////////// Todos //////////

Template.todos.loading = function () {
  // return todosHandle && !todosHandle.ready();
  return false;
};

Template.todos.any_list_selected = function () {
  // return !Session.equals('list_id', null);
  return true;
};

Template.todos.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      // var tag = Session.get('tag_filter');
      Todos.insert({
        text: text,
        list_id: Session.get('list_id'),
        done: false,
        timestamp: (new Date()).getTime(),
        test: false,
        // tags: tag ? [tag] : []
      });
      evt.target.value = '';
    }
  }));

Template.todo_panels.all_panels = function () {
  // Returns the set of all panels that are going to be shown
  // Should be divided into top, bottom

  var list_id_top = Session.get('list_id'),
      list_id_bot = Session.get('list_id_bot');

  var returnArray = {
    'top': {
      'list_name': 'Top List',
      'list_id': list_id_top
    },
    'bottom': {
      'list_name': 'Bottom List',
      'list_id': list_id_bot
    }
  };

  return returnArray;
};

Template.todos.todos = function () {
  // Given a list_id, returns the Todos of that list
  return Todos.find({list_id: this['list_id']}, {sort: {timestamp: 1}});
};

// Template.todo_item.tag_objs = function () {
//   var todo_id = this._id;
//   return _.map(this.tags || [], function (tag) {
//     return {todo_id: todo_id, tag: tag};
//   });
// };

Template.todo_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.todo_item.done_checkbox = function () {
  return this.done ? 'checked="checked"' : '';
};

Template.todo_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

// Template.todo_item.adding_tag = function () {
//   return Session.equals('editing_addtag', this._id);
// };

Template.todo_item.events({
  'click .check': function () {
    Todos.update(this._id, {$set: {done: !this.done}});
  },

  'click .destroy': function () {
    Todos.remove(this._id);
  },

  // 'click .addtag': function (evt, tmpl) {
  //   Session.set('editing_addtag', this._id);
  //   Deps.flush(); // update DOM before focus
  //   activateInput(tmpl.find("#edittag-input"));
  // },

  'dblclick .display .todo-text': function (evt, tmpl) {
    Session.set('editing_itemname', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#todo-input"));
  },

  // 'click .remove': function (evt) {
  //   var tag = this.tag;
  //   var id = this.todo_id;

  //   evt.target.parentNode.style.opacity = 0;
  //   // wait for CSS animation to finish
  //   Meteor.setTimeout(function () {
  //     Todos.update({_id: id}, {$pull: {tags: tag}});
  //   }, 300);
  // }
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

// Template.todo_item.events(okCancelEvents(
//   '#edittag-input',
//   {
//     ok: function (value) {
//       Todos.update(this._id, {$addToSet: {tags: value}});
//       Session.set('editing_addtag', null);
//     },
//     cancel: function () {
//       Session.set('editing_addtag', null);
//     }
//   }));

////////// Tracking selected list in URL //////////

var TodosRouter = Backbone.Router.extend({
  routes: {
    ":list_id": "main"
  },
  main: function (list_id) {
    var oldList = Session.get("list_id");
    if (oldList !== list_id) {
      Session.set("list_id", list_id);
      Session.set("list_id_bot", 'NQkynAC2jNgWiTgG9');
      // Session.set("tag_filter", null);
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
