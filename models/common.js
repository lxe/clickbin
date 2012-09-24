var crypto = require('crypto')

module.exports = {
  md5 : function(orginal_str){
      return crypto
        .createHash('md5')
        .update(orginal_str)
        .digest("hex")
  }
  , digest : function(password,salt){
      if(!salt) salt = crypto.randomBytes(23).toString('base64')
      var digest = this.sha2(password + salt)
      // apply stretching
      for (var i = 0; i < 4; i++) digest = this.sha2(digest)
      return {
          salt : salt
          , digest : digest
      };
  }
  , sha2 : function(password){
      return crypto
        .createHash('sha512')
        .update(password)
        .digest('hex')
  }
  , sha1 : function(msg,key) {
    return crypto
      .createHmac('sha256',key)
      .update(msg)
      .digest('hex')
  }
  , validateEmail : function(email){
      if(email){
          var reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$/
          return -1 !== email.search(reg)
      }
      return false
  }
  , validateUsername : function(username){
      if(username){
          var reg = /^[a-zA-z]{1,}[a-zA-Z0-9]{2,}$/
          return reg.test(username)
      }else return false
  }
  , validatePassword : function(password){
      return (
          password
           && password.length >= 6
           && -1 !== password.search(/^[^ \t\r\n]*$/)
       )
  }
}