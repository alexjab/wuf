// TODO allow perform validate on every step (set allowUnknown: true)
const { expect } = require('chai')

const Wuf = require('../')

const { user: userChanges, ride: rideChanges } = require('./fixtures/changes')

describe('Wuf', () => {
  describe('Wuf.createHistory', () => {
    it('should create an history', () => {
      const history = Wuf.createHistory({ 'user': userChanges })
      expect(history).to.be.an('object')
      expect(history).to.have.a.property('_indexes')
        .that.deep.equals({ '2017-08-17': 0, '2017-08-16': 1, '2017-08-15': 2 })
      expect(history).to.have.property('_versions').that.is.an('array').of.length(3)

      expect(history._versions[0]).to.have.property('_v', '2017-08-17')
      expect(history._versions[0]).to.have.property('user')
        .that.is.an('object')
        .that.has.keys('description', 'validate', 'response')
      expect(history._versions[0]).to.have.nested.property(
        'user.description',
        'This change adds a field `last_name`.'
      )
      expect(history._versions[0]).to.have.nested.property('user.validate.payload.isJoi', true)
      expect(history._versions[0]).to.have.nested.property('user.response.schema.isJoi', true)

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

    it('should create an history (two models that share a release date)', () => {
      const history = Wuf.createHistory({ 'user': userChanges, 'ride': rideChanges })
      expect(history).to.be.an('object')
      expect(history).to.have.a.property('_indexes')
        .that.deep.equals({ '2017-08-17': 0, '2017-08-16': 1, '2017-08-15': 2 })
      expect(history).to.have.property('_versions').that.is.an('array').of.length(3)

      expect(history._versions[0]).to.have.property('_v', '2017-08-17')
      expect(history._versions[0]).to.have.property('user')
        .that.is.an('object')
        .that.has.keys('description', 'validate', 'response')
      expect(history._versions[0]).to.have.nested.property(
        'user.description',
        'This change adds a field `last_name`.'
      )
      expect(history._versions[0]).to.have.nested.property('user.validate.payload.isJoi', true)
      expect(history._versions[0]).to.have.nested.property('user.response.schema.isJoi', true)

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
      expect(history._versions[1]).to.have.property('ride')
        .that.is.an('object')
        .that.has.keys('description', 'validate', 'response')
      expect(history._versions[1]).to.have.nested.property(
        'ride.description',
        'Initial API version'
      )
      expect(history._versions[1]).to.have.nested.property('ride.validate.payload.isJoi', true)
      expect(history._versions[1]).to.have.nested.property('ride.response.schema.isJoi', true)

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
      const history = Wuf.createHistory({ user: userChanges })
      const request = {
        version: '2017-08-17',
        payload: {
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
      expect(payload).to.deep.equal({
        last_name: 'Clarke',
        firstname: 'Isaac'
      })
      expect(request).to.deep.equal({
        version: '2017-08-17',
        payload: {
          first_name: 'Isaac',
          last_name: 'Clarke'
        }
      })
    })

    it('should downgrade the data (with lazy transform)', () => {
      const history = Wuf.createHistory({ ride: rideChanges })
      const request = {
        version: '2017-08-17',
        payload: {
          user: 'user_3K5mpxN',
          from_address: 'USG Ishimura',
          price: 4000
        }
      }

      const { version, payload } = Wuf.downgrade(
        'ride',
        request,
        history
      )
      expect(version).to.deep.equal('2017-08-16')
      expect(payload).to.deep.equal({
        user: 'user_3K5mpxN',
        from_address: 'USG Ishimura',
        price: 40
      })
      expect(request).to.deep.equal({
        version: '2017-08-17',
        payload: {
          user: 'user_3K5mpxN',
          from_address: 'USG Ishimura',
          price: 4000
        }
      })
    })

    it('should throw an error (invalid version requested)', () => {
      const history = Wuf.createHistory({ user: userChanges })
      const request = {
        version: '2017-08-01',
        payload: {
          first_name: 'Isaac',
          last_name: 'Clarke'
        }
      }

      let error
      try {
        Wuf.downgrade(
          'user',
          request,
          history
        )
      } catch (err) {
        error = err
      }
      expect(error).to.be.an('error')
      expect(error).to.have.property('message', 'Invalid version')
    })

    it('should do nothing (model does not have changes)', () => {
      const history = Wuf.createHistory({ user: userChanges })
      const request = {
        version: '2017-08-17',
        payload: {
          amount: 1000,
          currency: 'EUR'
        }
      }

      const downgraded = Wuf.downgrade(
        'charge',
        request,
        history
      )
      expect(downgraded).to.deep.equal({
        version: '2017-08-15',
        payload: {
          amount: 1000,
          currency: 'EUR'
        }
      })
      // This checks that the request has been cloned before processing
      expect(downgraded.payload).to.not.equal(request.payload)
    })
  })

  describe('Wuf.upgrade', () => {
    it('should upgrade the data', () => {
      const history = Wuf.createHistory({ user: userChanges })
      const response = {
        version: '2017-08-15',
        payload: {
          id: 'user_3K5mpxN',
          firstname: 'Isaac',
          last_name: 'Clarke'
        }
      }

      const { version, payload } = Wuf.upgrade(
        'user',
        response,
        history
      )
      expect(version).to.deep.equal('2017-08-17')
      expect(payload).to.deep.equal({
        id: 'user_3K5mpxN',
        last_name: 'Clarke',
        first_name: 'Isaac'
      })
      expect(response).to.deep.equal({
        version: '2017-08-15',
        payload: {
          id: 'user_3K5mpxN',
          firstname: 'Isaac',
          last_name: 'Clarke'
        }
      })
    })

    it('should upgrade the data (with lazy transform)', () => {
      const history = Wuf.createHistory({ ride: rideChanges })
      const request = {
        version: '2017-08-16',
        payload: {
          id: 'ride_jeNAH3w',
          user: 'user_3K5mpxN',
          from_address: 'USG Ishimura',
          price: 40
        }
      }

      const { version, payload } = Wuf.upgrade(
        'ride',
        request,
        history
      )
      expect(version).to.deep.equal('2017-08-17')
      expect(payload).to.deep.equal({
        id: 'ride_jeNAH3w',
        user: 'user_3K5mpxN',
        from_address: 'USG Ishimura',
        price: 4000
      })
      expect(request).to.deep.equal({
        version: '2017-08-16',
        payload: {
          id: 'ride_jeNAH3w',
          user: 'user_3K5mpxN',
          from_address: 'USG Ishimura',
          price: 40
        }
      })
    })

    it('should throw an error (invalid version in the response)', () => {
      const history = Wuf.createHistory({ user: userChanges })
      const response = {
        version: '2017-08-01',
        payload: {
          id: 'user_3K5mpxN',
          firstname: 'Isaac',
          last_name: 'Clarke'
        }
      }

      let error
      try {
        Wuf.upgrade(
          'user',
          response,
          history
        )
      } catch (err) {
        error = err
      }
      expect(error).to.be.an('error')
      expect(error).to.have.property('message', 'Invalid version')
    })

    it('should do nothing (model does not have changes)', () => {
      const history = Wuf.createHistory({ user: userChanges })
      const request = {
        version: '2017-08-15',
        payload: {
          amount: 1000,
          currency: 'EUR'
        }
      }

      const upgraded = Wuf.upgrade(
        'charge',
        request,
        history
      )
      expect(upgraded).to.deep.equal({
        version: '2017-08-17',
        payload: {
          amount: 1000,
          currency: 'EUR'
        }
      })
      expect(upgraded.payload).to.not.equal(request.payload)
    })
  })
})
