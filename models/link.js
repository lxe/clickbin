var _ = require('underscore')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')

module.exports = mongoose.model('Link', LinkSchema)