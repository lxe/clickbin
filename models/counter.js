var mongoose = require('mongoose')
  , Schema  = mongoose.Schema

var Counter = new Schema({
  value : {
    type : Number
    , required : true
    , default : 0
  }
  , name : {
    type : String
    , required: true
    , index : { unique : true }
  }
},{strict:true})

Counter.statics.findAndModify = function(query, sort, doc, options, callback){
  return this.collection.findAndModify(query,sort,doc,options,callback)
}

Counter.statics.increment = function(name,startval,cb){
  if(!cb){
    cb = startval
    startval = 1
  }
  var Model = mongoose.model(this.modelName)
  Model.findAndModify(
    // query
    { name : name }
    // sort
    , []
    // doc
    , { $inc : { value : 1 } }
    // opts
    , {
      'new' : true
      , upsert : false
    }
    // cb
    , function(err,counter){
      if(err) return cb(err)
      if(counter) return cb(null, counter.value)
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
            if(err) return cb(err)
            if(counter) return cb(null,counter.value)
            else return cb(new Error("there was a conflict in updating the "
              + "counter. try running the command again"))
          }
        )
    }
  )
}


module.exports = mongoose.model('Counter',Counter)