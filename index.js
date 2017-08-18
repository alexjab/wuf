// TODO downgrade / upgrade to specific version
// TODO allow custom/lazy operation
// TODO make a test method with rolls all the migrations with allow unknown
const Joi = require('joi')
const Hoek = require('hoek')

const unset = require('lodash.unset')
const set = require('lodash.set')
const get = require('lodash.get')

function copy (after, before) {
  return { action: 'copy', after, before }
}

function remove (after) {
  return { action: 'remove', after }
}

function createHistory (models) {
  const allVersions = {}
  const versionNums = []
  const names = Object.keys(models)

  for (const name of names) {
    const model = models[name]
    const nums = Object.keys(model)
    for (const num of nums) {
      if (!allVersions[num]) {
        versionNums.push(num)
        allVersions[num] = { _v: num }
      }
      allVersions[num][name] = models[name][num]
    }
  }
  versionNums.sort((a, b) => b - a)

  const versionIndexes = {}
  for (let i = 0; i < versionNums.length; i++) {
    versionIndexes[versionNums[i]] = i
  }

  const _indexes = {}
  const _versions = versionNums.map((num, i) => {
    _indexes[num] = i
    return allVersions[num]
  })

  return {
    _indexes,
    _versions
  }
}

// Applying the transformation means downgrading
function apply (payload, transformations) {
  const target = Hoek.clone(payload)

  for (const t of transformations) {
    if (t.action === 'remove') {
      unset(target, t.after)
    }

    if (t.action === 'copy') {
      const value = get(payload, t.after)
      set(target, t.before, value)
    }
  }

  return target
}

// Rollbacking the transformation means upgrading
function rollback (payload, transformations) {
  const target = Hoek.clone(payload)

  for (const t of transformations) {
    if (t.action === 'copy') {
      const value = get(payload, t.before)
      set(target, t.after, value)
    }
  }

  return target
}

function downgrade (model, request, history) {
  let version = request.version
  const index = history._indexes[version]

  if (!index && index !== 0) {
    throw new Error('Invalid version')
  }

  const versions = history._versions
  let payload = Hoek.clone(request.payload)

  for (let i = index; i < versions.length; i++) {
    version = versions[i]._v

    if (versions[i][model]) {
      const validate = versions[i][model].validate
      const transform = versions[i][model].transform

      if (i === index && validate) {
        payload = Joi.attempt(
          request.payload,
          validate.payload
        )
      }

      if (transform) {
        payload = apply(payload, transform.payload)
      }
    }
  }

  return { version, payload }
}

function upgrade (model, response, history) {
  let version = response.version
  const index = history._indexes[version]

  if (!index && index !== 0) {
    throw new Error('Invalid version')
  }

  const versions = history._versions
  let payload = Hoek.clone(response.payload)

  for (let i = index; i >= 0; i--) {
    version = versions[i]._v

    if (versions[i][model]) {
      const format = versions[i][model].response
      const transform = versions[i][model].transform

      if (transform) {
        payload = rollback(payload, transform.payload)
      }

      if (i === 0 && format) {
        payload = Joi.attempt(
          payload,
          format.schema
        )
      }
    }
  }

  return { version, payload }
}

module.exports = {
  copy,
  remove,

  createHistory,
  downgrade,
  upgrade
}
