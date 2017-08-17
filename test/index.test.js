const Joi = require('joi')
const { expect } = require('chai')

const Wuf = require('../')

const changes = require('./fixtures/changes')

describe('Wuf', () => {
  describe('Wuf.createHistory', () => {
    it('should create an history', () => {

      const history = Wuf.createHistory({ 'user': changes })
      expect(history).to.be.an('object')
      expect(history).to.have.a.property('_indexes')
        .that.deep.equals({ '2017-08-17': 0, '2017-08-16': 1, '2017-08-15': 2 })
      expect(history).to.have.property('_versions').that.is.an('array').of.length(3)

      expect(history._versions[0]).to.have.property('_v', '2017-08-17')
      expect(history._versions[0]).to.have.property('user')
        .that.is.an('object')
        .that.has.keys('description', 'validate')
      expect(history._versions[0]).to.have.nested.property(
        'user.description',
        'This change adds a field `last_name`.'
      )
      expect(history._versions[0]).to.have.nested.property('user.validate.payload.isJoi', true)

      expect(history._versions[1]).to.have.property('_v', '2017-08-16')
      expect(history._versions[1]).to.have.property('user')
        .that.is.an('object')
        .that.has.keys('description', 'validate', 'transform')
      expect(history._versions[1]).to.have.nested.property(
        'user.description',
        'This change renames the field `firstname` to `first_name`.'
      )
      expect(history._versions[1]).to.have.nested.property('user.validate.payload.isJoi', true)
      expect(history._versions[1]).to.have.nested.property('user.transform')
        .that.has.keys('payload')
      expect(history._versions[1]).to.have.nested.property('user.transform.payload')
        .that.is.an('array')
        .that.deep.equals([
          { action: 'copy', after: 'first_name', before: 'firstname' },
          { action: 'remove', after: 'first_name' }
        ])

      expect(history._versions[2]).to.have.property('_v', '2017-08-15')
      expect(history._versions[2]).to.have.property('user')
        .that.is.an('object')
        .that.has.keys('description', 'validate')
      expect(history._versions[2]).to.have.nested.property(
        'user.description',
        'Initial API version'
      )
      expect(history._versions[2]).to.have.nested.property('user.validate.payload.isJoi', true)
    })
  })

  describe('Wuf.downgrade', () => {
    it('should downgrade the data', () => {
      const history = Wuf.createHistory({ user: changes })
      const request = {
        version: '2017-08-17',
        payload: {
          id: 'user_3K5mpxN',
          first_name: 'Isaac',
          last_name: 'Clarke'
        }
      }

      const { version, payload } = Wuf.downgrade(
        'user',
        request,
        history
      )
      expect(version).to.deep.equal('2017-08-15')
      expect(payload).to.deep.equal({ id: 'user_3K5mpxN', last_name: 'Clarke', firstname: 'Isaac' })
    })
  })
})
