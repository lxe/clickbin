/**
 * Counter model - counts the number of anonymous bins
 */

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema

var Counter = new Schema({
  value : {
      type     : Number
    , required : true
    , default  : 0
  }
  , name : {
      type     : String
    , required : true
    , index    : { unique : true }
  }
}, { strict: true })

/**
 * [findAndModify description]
 * @param  {[type]}   query    [description]
 * @param  {[type]}   sort     [description]
 * @param  {[type]}   doc      [description]
 * @param  {[type]}   options  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Counter.statics.findAndModify = function(query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback)
}

/**
 * [increment description]
 * @param  {[type]}   name     [description]
 * @param  {[type]}   startval [description]
 * @param  {Function} cb       [description]
 * @return {[type]}            [description]
 */
Counter.statics.increment = function(name, startval, cb) {
  if (!cb) {
    cb = startval
    startval = 1
  }

  var Model = mongoose.model(this.modelName)
  Model.findAndModify(
      { name : name }          // query
    , []                       // sort
    , { $inc : { value : 1 } } // doc
    , { 'new' : true, upsert : false } // options
    , function(err, counter){
      if (err)     return cb(err)
      if (counter) return cb(null, counter.value)
      else Model.findAndModify(
          {
              name : name
            , value : { $exists : false }
          }
          , []
          , {
              name : name
            , value : startval
          }
          , {
             'new' : true
            , upsert : true
          }
          , function(err,counter){
            if(err)     return cb(err)
            if(counter) return cb(null, counter.value)
            else return cb(new Error(
                "there was a conflict in updating the "
              + "counter. try running the command again"))
          }
        )
    }
  )
}

module.exports = mongoose.model('Counter',Counter)