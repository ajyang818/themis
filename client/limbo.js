// A holding ground for all the code I'm commenting out

// Name of currently selected tag for filtering
// Session.setDefault('tag_filter', null);

// When adding tag to a todo, ID of the todo
// Session.setDefault('editing_addtag', null);


////////// Tag Filter //////////

// Pick out the unique tags from all todos in current list.
// Template.tag_filter.tags = function () {
//   var tag_infos = [];
//   var total_count = 0;

//   Todos.find({list_id: Session.get('list_id')}).forEach(function (todo) {
//     _.each(todo.tags, function (tag) {
//       var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
//       if (! tag_info)
//         tag_infos.push({tag: tag, count: 1});
//       else
//         tag_info.count++;
//     });
//     total_count++;
//   });

//   tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
//   tag_infos.unshift({tag: null, count: total_count});

//   return tag_infos;
// };

// Template.tag_filter.tag_text = function () {
//   return this.tag || "All items";
// };

// Template.tag_filter.selected = function () {
//   return Session.equals('tag_filter', this.tag) ? 'selected' : '';
// };

// Template.tag_filter.events({
//   'mousedown .tag': function () {
//     if (Session.equals('tag_filter', this.tag))
//       Session.set('tag_filter', null);
//     else
//       Session.set('tag_filter', this.tag);
//   }
// });

///////////////////////////////////

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

// Template.todo_item.tag_objs = function () {
//   var todo_id = this._id;
//   return _.map(this.tags || [], function (tag) {
//     return {todo_id: todo_id, tag: tag};
//   });
// };

// Template.todo_item.adding_tag = function () {
//   return Session.equals('editing_addtag', this._id);
// };

  // 'click .addtag': function (evt, tmpl) {
  //   Session.set('editing_addtag', this._id);
  //   Deps.flush(); // update DOM before focus
  //   activateInput(tmpl.find("#edittag-input"));
  // },

  // 'click .remove': function (evt) {
  //   var tag = this.tag;
  //   var id = this.todo_id;

  //   evt.target.parentNode.style.opacity = 0;
  //   // wait for CSS animation to finish
  //   Meteor.setTimeout(function () {
  //     Todos.update({_id: id}, {$pull: {tags: tag}});
  //   }, 300);
  // }
