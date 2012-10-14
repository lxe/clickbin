var _ = require('underscore')
  , config = require('../config')
  , mongo = require('mongoose')
  , User = require('../models/user')
  , Bin = require('../models/bin')
  , Link = require('../models/link')


mongo.connect(config.mongoPath)
mongo.connection.on('open', function() {
  User.collection.drop()
  Bin.collection.drop()
  Link.collection.drop()
  mongo.disconnect()
  process.exit()
})