const Joi = require('joi')

const Wuf = require('../../')

module.exports = {
  user: {
    '2017-08-17': {
      description: 'This change adds a field `last_name`.',
      validate: {
        payload: Joi.object().keys({
          first_name: Joi.string().required(),
          last_name: Joi.string().required()
        }).required()
      },
      response: {
        schema: Joi.object().keys({
          id: Joi.string().required(),
          first_name: Joi.string().required(),
          last_name: Joi.string().required()
        }).options({ stripUnknown: true })
      }
    },
    '2017-08-16': {
      description: 'This change renames the field `firstname` to `first_name`.',
      validate: {
        payload: Joi.object().keys({
          first_name: Joi.string().required()
        }).required()
      },
      transform: {
        payload: [
          Wuf.copy('first_name', 'firstname'),
          Wuf.remove('first_name')
        ]
      }
    },
    '2017-08-15': {
      description: 'Initial API version',
      validate: {
        payload: Joi.object().keys({
          firstname: Joi.string().required()
        }).required()
      }
    }
  },
  charge: {
  },
  ride: {
    '2017-08-17': {
      description: 'The field `price` must now be speficied in cents ' +
       'and not units of the currency.',
      validate: {
        payload: Joi.object().keys({
          user: Joi.string().required(),
          from_address: Joi.string().required(),
          price: Joi.number().required()
        }).required()
      },
      transform: {
        payload: [
          Wuf.lazyDowngrade(
            request => request.price / 100,
            'price'
          ),
          Wuf.lazyUpgrade(
            'price',
            response => response.price * 100
          )
        ]
      },
      response: {
        schema: Joi.object().keys({
          id: Joi.string().required(),
          user: Joi.string().required(),
          from_address: Joi.string().required(),
          price: Joi.number().required()
        }).required().options({ stripUnknown: true })
      }
    },
    '2017-08-16': {
      description: 'Initial API version',
      validate: {
        payload: Joi.object().keys({
          user: Joi.string().required(),
          from_address: Joi.string().required(),
          price: Joi.number().required()
        }).required()
      },
      response: {
        schema: Joi.object().keys({
          id: Joi.string().required(),
          user: Joi.string().required(),
          from_address: Joi.string().required(),
          price: Joi.number().required()
        }).required().options({ stripUnknown: true })
      }
    }
  }
}
