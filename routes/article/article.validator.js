
const verifyUniqueArticle = async (request) => {
  // Find an entry from the database that
  // matches either the email or username
  const daysForUniqueArticle = 2;
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - daysForUniqueArticle);
  try {
    const article = await Article.find({
      $and: [{
        url: new RegExp(request.payload.url, 'i'),
      },
      {
        submittedDate: {
          $gt: new Date(currentDate),
        },
      },
      ],
    })
      .sort('-submittedDate');

    if (article && article.length > 0) {
      return Boom.badRequest('Thanks but this article has already been submitted recently.');
    }

    return request.payload;
  } catch (error) {
    return Boom.badImplementation(error);
  }
};

module.exports = {
  verifyUniqueArticle
}