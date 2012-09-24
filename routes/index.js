/**
 * 
 */

var fs = require('fs')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function(app) {

  /**
   * [ description]
   * @param  {[type]} file [description]
   * @return {[type]}      [description]
   */
  fs.readdirSync(__dirname).forEach(function(file) {
    if (file == "index.js") return
    var name = file.substr(0, file.indexOf('.'))
    require('./' + name)(app)
  });

  /**
   * [ description]
   * @param  {[type]} req [description]
   * @param  {[type]} res [description]
   * @return {[type]}     [description]
   */
  app.get('/', function(req, res) {
    return res.render('landing', {
      title: 'ClickBin'
    });
  });
}
