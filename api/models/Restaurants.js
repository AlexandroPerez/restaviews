/**
 * Restaurant.js
 *
 * A user who can log in to this application.
 */

 module.exports = {

  attributes: {
    //  Primitives
    name: {
      type: 'string',
      description: 'Name of Restaurant.',
      required: true,
      maxLength: 64,
      example: 'Mission Chinese Food'
    },

    neighborhood: {
      type: 'string',
      description: 'Neighborhood of Restaurant.',
      required: true,
      maxLength: 64,
      example: 'Manhattan'
    },

    photograph: {
      type: 'string',
      description: 'File name without extension of Photograph.',
      required: true,
      maxLength: 64,
      example: '1'
    },

    address: {
      type: 'string',
      required: true,
      description: 'Address of Restaurant',
      maxLength: 120,
      example: '171 E Broadway, New York, NY 10002'
    },

    latlng: {
      type: 'json',
      required: true,
      description: 'lat and lon for map data',
      example: '{"lat": 40.713829,"lng": -73.989667}'
    },

    cuisine_type: {
      type: 'string',
      required: true,
      description: 'Type of cuisinet',
      maxLength: 32,
      example: 'Asian'
    },

    operating_hours: {
      type: 'json',
      required: true,
      description: 'operating hours as an object',
      example: '{"Monday":"5:30 pm - 11:00 pm", "Tuesday": "...",...}'
    },

    is_favorite: {
      type: 'boolean',
      description: 'If Restaurant is set as favorite or not by user'
    },
  },
};
