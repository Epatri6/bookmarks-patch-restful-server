function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Google',
      url: 'http://www.google.com',
      description: 'search engine',
      rating: '4'
    },
    {
      id: 2,
      title: 'Amazon',
      url: 'http://www.amazon.com',
      description: 'e-commerce',
      rating: '3'
    },
    {
      id: 3,
      title: 'Bing',
      url: 'http://www.bing.com',
      description: 'search engine?',
      rating: '2'
    }
  ]
}

module.exports = { makeBookmarksArray }