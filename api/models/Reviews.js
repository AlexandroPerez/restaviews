/**
 * Reviews.js
 *
 * Reviews for the restaurants
 */

module.exports = {

  attributes: {
    // Primitives
    restaurant_id: {
      type: 'number',
      required: true,
      description: 'Id of the restaurant'
    },

    name: {
      type: 'string',
      description: 'Name provided by user',
      required: true,
      maxLength: 64
    },

    rating: {
      type: 'number',
      description: 'A rating between 1 and 5, no floats',
      required: true
    },

    comments: {
      type: 'string',
      required: true,
      description: 'Address of Restaurant',
      maxLength: 1024
    }
  }
};
