////////////////////////////////////////////////////////////////
// MODELS

// Lists -- {name: String,
//           date_list: Boolean,
//           slug: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function () {
  return Lists.find();
});

// Todos -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number,
//           type: String,}
Todos = new Meteor.Collection("todos");

// Publish all items for requested list_id.
Meteor.publish('todos', function (list_ids) {
  check(list_ids, Array);
  return Todos.find({list_id: {$in: list_ids}});
});
