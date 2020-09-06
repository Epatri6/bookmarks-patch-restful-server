const express = require('express');
const { v4: uuid } = require('uuid');
const path = require('path');

//const bookmarks = require('./bookmarkStore');
const logger = require('./logger.js');
const BookmarksService = require('./BookmarksService');
const xss = require('xss');

const bookmarksRouter = express.Router();
const bodyParser = express.json();
const isUrl = require('is-valid-http-url');

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmarks) => res.status(200).json(bookmarks))
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;
    const ratingNum = Number(rating);

    if (!title) {
      logger.error('Title is required.');
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!url) {
      logger.error('URL is required.');
      return res.status(400).json({ message: 'URL is required' });
    }

    if (!description) {
      logger.error('Description is required.');
      return res.status(400).json({ message: 'Description is required' });
    }

    if (!rating) {
      logger.error('Rating is required.');
      return res.status(400).json({ message: 'Rating is required' });
    }

    if (Number.isNaN(ratingNum)) {
      logger.error(`Rating must be a number. Received ${rating}`);
      return res.status(400).json({ message: 'Rating must be a number' });
    }
    if (!isUrl(url)) {
      logger.error(`Invalid URL. Received ${url}`);
      return res.status(400).json({ message: 'Please provide a valid URL' });
    }

    const newBookmark = {
      title: xss(title),
      url: xss(url),
      description: xss(description),
      rating,
    };
    BookmarksService.postBookmark(req.app.get('db'), newBookmark).then(
      (result) => {
        return res.location(path.posix.join(req.originalUrl, `/${result.id}`)).status(201).json(result);
      }
    );
  });

bookmarksRouter
  .route('/:id')
  .get((req, res, next) => {
    const { id } = req.params;

    BookmarksService.getBookmark(req.app.get('db'), id)
      .then((bookmark) => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({ message: 'Bookmark not found' });
        }

        res.status(200).json(bookmark);
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;

    BookmarksService.getBookmark(req.app.get('db'), id).then((bookmark) => {
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      BookmarksService.deleteBookmark(req.app.get('db'), id).then(() => {
        return res.status(204).end();
      });
    });
  })
  .patch(bodyParser, (req, res, next) => {
    const {title, description, rating, url} = req.body;
    const bookmarkUpdate = {title, description, rating, url};
       const numberOfValues = Object.values(bookmarkUpdate).filter(Boolean).length
       if (numberOfValues === 0) {
         return res.status(400).json({
           error: {
             message: 'Must provide field to update'
           }
         })
       }
    
    BookmarksService.updateBookmark(req.app.get('db'), req.params.id, bookmarkUpdate)
    .then(() => {
      return res.status(204).end();
    })
  });

module.exports = bookmarksRouter;
