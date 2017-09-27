const Twitter = require('twitter');

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const vuedocsUrl = 'https://vuedocs.io/'

exports.tweet =  function tweet (title, id) {
  const status = `${title} ${vuedocsUrl}${id}`
  return client.post('statuses/update', {status: status})
}
