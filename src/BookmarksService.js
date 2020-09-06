const BookmarksService = {
  getAllBookmarks(knex) {
    return knex('bookmarks').select('*');
  },

  getBookmark(knex, id) {
    return knex('bookmarks').select('*').where({ id }).first();
  },

  postBookmark(knex, bookmark) {
    return knex
      .insert(bookmark)
      .into('bookmarks')
      .returning('*')
      .then((row) => {
        return row[0];
      });
  },

  deleteBookmark(knex, id) {
    return knex('bookmarks').where({ id }).delete();
  },
};

module.exports = BookmarksService;
