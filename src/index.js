module.exports = function () {
  var Promise = module.exports.config.Promise;

  function findMatchingRequest(request) {
    var method = request.method.toLowerCase(),
        url = request.url.toLowerCase(),
        $$when = http.$$when.slice(),
        match = null;

    if (!http.latestWins){
      $$when = $$when.reverse();
    }

    return $$when.filter(function (when) {
      var match;
      if (when.method instanceof RegExp){
        if (!when.method.test(method)){
          return false;
        }
      }else if (when.method !== method){
        return false;
      }

      if (when.url instanceof RegExp){
        if (match = url.match(when.url)){
          request.match = request.match || match;
        }else{
          return false;
        }
      }else if (when.url !== url){
        return false;
      }

      return true;
    });
  }

  function http(options){
    options = Object.assign({method : 'get'}, options);

    var whenArr = findMatchingRequest(options);
    if (whenArr.length){
      whenArr[0].count++;
    }

    options.next = function (o, increment) {
      var result;
      var when = whenArr.shift();
      if (when){
        if (increment !== false){
          when.count++;
        }
        when.callback.forEach(function (cb) {
          result = cb(options);
        });
      }
      return result;
    };

    var promise = Promise.resolve().then(function () {
      if (!whenArr.length){
        if (http.strict){
          throw new Error('Unexpected ' + options.method + ': ' + options.url);
        }else{
          return;
        }
      }

      return options.next(null, false);
    });

    http.$$requests.push(promise);

    if (http.immediate && promise.flush){
      promise.flush();
    }

    return promise;
  }
  http.get = function (url, options) {
    options = Object.assign({method : 'GET'}, options, {url : url});
    return http(options);
  };
  http.delete = function (url, options) {
    options = Object.assign({method : 'DELETE'}, options, {url : url});
    return http(options);
  };
  http.options = function (url, options) {
    options = Object.assign({method : 'OPTIONS'}, options, {url : url});
    return http(options);
  };
  http.post = function (url, data, options) {
    options = Object.assign({method : 'POST'}, options, {url : url, data : data});
    return http(options);
  };
  http.put = function (url, data, options) {
    options = Object.assign({method : 'PUT'}, options, {url : url, data : data});
    return http(options);
  };
  http.patch = function (url, data, options) {
    options = Object.assign({method : 'PATCH'}, options, {url : url, data : data});
    return http(options);
  };
  http.when = function (method, url) {
    var any = /.*/;
    if (method === undefined && url === undefined){
      method = url = any;
    }else if (url === undefined){
      url = method;
      method = any;
    }

    if (typeof method === 'string'){
      method = method.toLowerCase();
    }
    if (typeof url === 'string'){
      url = url.toLowerCase();
    }

    var when = {
      method : method,
      url : url,
      callback : [],
      count : 0
    };

    this.$$when.unshift(when);

    var chainable = {
      return : function (value) {
        when.callback.push(function(){
          return value;
        });
        return chainable;
      },
      call : function (cb) {
        when.callback.push(cb);
        return chainable;
      },
      stop : function () {
        when.callback.push(function(){
          return new Promise(function(){});
        });
        return chainable;
      },
      throw : function(value){
        return this.reject(value);
      },
      reject : function (value) {
        when.callback.push(function(){
          return Promise.reject(value);
        });
        return chainable;
      },
      next : function () {
        when.callback.push(function (options) {
          return options.next();
        });
        return chainable;
      }
    };
    return chainable;
  };
  http.otherwise = function () {
    this.$$when.reverse();
    var result = this.when();
    this.$$when.reverse();
    return result;
  };
  http.expect = function (method, url, count) {
    if (count === undefined && typeof url === 'number'){
      count = url;
      url = undefined;
    }
    var result = http.when(method, url);
    var when = http.$$when[0];
    when.expected = count;
    http.$$expect.push(when);
    return result;
  };
  http.assert = function () {
    var $$expect = http.$$expect.splice(0);
    while ($$expect.length){
      var expected = $$expect.shift();
      if (typeof expected.expected === 'number'){
        if (expected.expected !== expected.count){
          throw new Error('Expected {method : ' + expected.method + ', url : ' + expected.url + '} to have been called ' + expected.expected + ' times but was only called ' + expected.count + ' times');
        }
      }else if (expected.count < 1){
        throw new Error('Expected a call for {method : ' + expected.method + ', url : ' + expected.url + '}');
      }
    }
  };
  http.$$when = [];
  http.$$expect = [];
  http.$$requests = [];
  http.strict = true;
  http.latestWins = true;
  http.immediate = false;
  http.flush = function () {
    this.$$requests.forEach(function (request) {
      if (request.flush){
        request.flush();
      }
    });
  };

  return http;
};
module.exports.config = {
  Promise : Promise
};
