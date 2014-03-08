////////////////////////////////////////////////////////////////
// MODELS

// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function () {
  return Lists.find();
});

// DateLists -- {date: Date,
//              type: String}
DateLists = new Meteor.Collection("dateLists");

Meteor.publish("dateLists", function() {
    return DateLists.find();
});

// Todos -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number}
Todos = new Meteor.Collection("todos");

// Publish all items for requested list_id.
Meteor.publish('todos', function (list_id) {
  check(list_id, String);
  return Todos.find({list_id: list_id});
});

// DateTodos -- {text: String,
//               done: Boolean,
//               type: String,
//               list_date: Date}
DateTodos = new Meteor.Collection("dateToDos");

Meteor.publish('dateTodos', function (list_date, type) {
    check(list_date, Date);
    check(type, String);
    return DateTodos.find({list_date: list_date, type: type});
});
