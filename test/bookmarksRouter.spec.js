const knex = require('knex');
const supertest = require('supertest');

const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');
const { expect } = require('chai');


describe('Bookmarks Endpoints', () => {
  let db;
  before('Make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  before('Clean the table', () => db('bookmarks').truncate());
  afterEach(() => db('bookmarks').truncate());

  after('Clean up', () => db.destroy());

  context('Given "bookmarks" has no data', () => {
    it('Get /bookmarks should return an empty array', () => {
      return supertest(app)
        .get('api/bookmarks')
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(200, []);
    });

    it('Get /bookmarks/:id should return 404', () => {
      return supertest(app)
        .get('api/bookmarks/1')
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(404, {'message': 'Bookmark not found'});
    });

    it('Creates a new bookmark', () => {
      const newData = {
        title: 'Rawrrawr',
        url: 'https://google.com',
        description: 'eh',
        rating: 3
      }
      const expected = {
        ...newData,
        rating: '3',
        id: 1
      }
      return supertest(app)
      .post('api/bookmarks')
      .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
      .send(newData)
      .expect(201)
      .expect(res => {
        expect(res.headers.location).to.eql(`api/bookmarks/${expected.id}`)
        expect(res.body).to.eql(expected);
        return supertest(app).get(`/bookmarks/${res.id}`).expect(expected);
      });
    });

    const fields = ['title', 'url', 'rating'];
    const newData = {
      title: 'Facebook',
      url: 'https://facebook.com',
      rating: 3
    }
    fields.forEach(field => {
      it(`fails to create bookmark with invalid ${field}`, () => {
        const testData = {
          ...newData
        };
        testData[field] = '';
        return supertest(app).post('api/bookmarks')
        .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
        .send(testData)
        .expect(400);
      })
    })
  });

  context('Given "bookmarks" has data in the table', () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach(() => db('bookmarks').insert(testBookmarks));

    it('GET /bookmarks returns 200 status and all bookmarks', () => {
      return supertest(app)
        .get('api/bookmarks')
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(200, testBookmarks);
    });

    it('Get /bookmarks/:id should return first bookmark', () => {
      const id = 1;
      return supertest(app)
        .get(`api/bookmarks/${id}`)
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(200, testBookmarks[id - 1])
    });

    it('fails to delete non existant bookmark', () => {
      const id = 15;
      return supertest(app).delete(`api/bookmarks/${id}`)
      .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
      .expect(404, {message: 'Bookmark not found'});
    })

    it('deletes a bookmark', () => {
      const id = 1;
      return supertest(app).delete(`api/bookmarks/${id}`)
      .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
      .expect(204);
    });
  });

   describe.only(`PATCH /api/bookmarks/:id`, () => {
       context(`Given no bookmarks`, () => {
         it(`responds with 404`, () => {
           const bookmarkId = 123456
           return supertest(app)
             .patch(`/api/bookmarks/${bookmarkId}`)
             .expect(404, { error: { message: `Bookmark not found` } })
         });
       });
          context('Given there are articles in the database', () => {
             const testBookmarks = makeBookmarksArray();        
             beforeEach('insert bookmarks', () => {
               return db
                 .into('bookmarks')
                 .insert(testBookmarks);
             })
        
             it('responds with 204 and updates the bookmark', () => {
               const idToUpdate = 2
               const updateBookmark = {
                 title: 'updated bookmark title',
                 url: 'https://Whatever.com',
                 rating: 5,
                 description: 'updated bookmark content',
               }
                  const expectedBookmark = {
                     ...testBookmarks[idToUpdate - 1],
                     ...updateBookmark
                   }
               return supertest(app)
                 .patch(`/api/bookmarks/${idToUpdate}`)
                 .send(updateBookmark)
                 .expect(204)
                     .then(res =>
                         supertest(app)
                           .get(`/api/bookmarks/${idToUpdate}`)
                           .expect(expectedBookmark)
                       )
             })
           })

           it('responds with 204 and updates the bookmark with partial', () => {
            const idToUpdate = 2
            const updateBookmark = {
              title: 'updated bookmark title',
              description: 'updated bookmark content',
            }
               const expectedBookmark = {
                  ...testBookmarks[idToUpdate - 1],
                  ...updateBookmark
                }
            return supertest(app)
              .patch(`/api/bookmarks/${idToUpdate}`)
              .send(updateBookmark)
              .expect(204)
                  .then(res =>
                      supertest(app)
                        .get(`/api/bookmarks/${idToUpdate}`)
                        .expect(expectedBookmark)
                    )
          })

          it('responds with 400 when no fields provided', () => {
            const idToUpdate = 2
            const updateBookmark = {
              title: '',
              url: ''
            }
               const expectedBookmark = {
                  ...testBookmarks[idToUpdate - 1],
                  ...updateBookmark
                }
            return supertest(app)
              .patch(`/api/bookmarks/${idToUpdate}`)
              .send(updateBookmark)
              .expect(400, {error: {message: 'Must provide field to update'}})
          })
    });
});
