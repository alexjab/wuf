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
      versionNums.push(num)
      if (!allVersions[num]) {
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
function apply (data, original, transformations) {
  for (const t of transformations) {
    if (t.action === 'remove') {
      unset(data, t.after)
    }

    if (t.action === 'copy') {
      const value = get(original, t.after)
      set(data, t.before, value)
    }
  }
}

// Rollbacking the transformation means upgrading
function rollback (data, original, transformations) {
  for (const t of transformations) {
    if (t.action === 'copy') {
      const value = get(data, t.before)
      unset(data, t.before)
      set(data, t.after, value)
    }
  }
}

function downgrade (model, request, history) {
  const version = request.version
  const _request = {}
  const index = history._indexes[version]
  const versions = history._versions

  if (!index && index !== 0) {
    throw new Error('Invalid version')
  }

  _request.payload = Hoek.clone(request.payload)

  for (let i = index; i < versions.length; i++) {
    _request.version = versions[i]._v

    if (versions[i][model]) {
      const validate = versions[i][model].validate
      const transform = versions[i][model].transform

      if (validate && i === index) {
        _request.payload = Joi.attempt(
          _request.payload,
          validate.payload
        )
      }

      if (transform) {
        apply(_request.payload, Hoek.clone(request.payload), transform.payload)
      }
    }
  }

  for (const field of Object.keys(request)) {
    if (!_request[field] && request[field]) {
      _request[field] = request[field]
    }
  }

  return _request
}

function upgrade (model, input, history) {
  const version = input.version
  const _input = {}
  _input.payload = Hoek.clone(input.payload)
  const index = history._indexes[version]
  const versions = history._versions

  if (!index && index !== 0) {
    throw new Error('Invalid version')
  }

  for (let i = index; i >= 0; i--) {
    _input.version = versions[i]._v

    if (versions[i][model]) {
      const transform = versions[i][model].transform

      if (transform) {
        rollback(_input.payload, Hoek.clone(input.payload), transform.payload)
      }
    }
  }

  for (const field of Object.keys(input)) {
    if (!_input[field] && input[field]) {
      _input[field] = input[field]
    }
  }

  return _input
}

module.exports = {
  copy,
  remove,
  createHistory,
  downgrade,
  upgrade
}
