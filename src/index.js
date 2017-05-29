module.exports = function () {
  var Promise = module.exports.config.Promise;

  function findMatchingRequest(request) {
    var method = request.method.toLowerCase(),
        url = request.url.toLowerCase(),
        $$when = http.$$when.slice();

    if (!http.latestWins){
      $$when = $$when.reverse();
    }

    for (var x = $$when.length-1; x >= 0; x--){
      var when = $$when[x];
      if (when.method instanceof RegExp){
        if (!when.method.test(method)){
          continue;
        }
      }else if (when.method !== method){
        continue;
      }

      if (when.url instanceof RegExp){
        if (!when.url.test(url)){
          continue;
        }
      }else if (when.url !== url){
        continue;
      }

      return when;
    }
  }

  function http(options){
    options = Object.assign({method : 'get'}, options);

    var when = findMatchingRequest(options);
    if (when){
      when.count++;
    }

    var promise = Promise.resolve().then(function () {
      if (!when){
        if (http.strict){
          throw new Error('Unexpected ' + options.method + ': ' + options.url);
        }else{
          return;
        }
      }

      if (when.callback){
        return when.callback(options);
      }
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
      callback : undefined,
      count : 0
    };

    this.$$when.push(when);

    return {
      return : function (value) {
        when.callback = function(){
          return value;
        };
        return this;
      },
      call : function (cb) {
        when.callback = cb;
        return this;
      },
      stop : function () {
        when.callback = function(){
          return new Promise(function(){});
        };
        return this;
      },
      throw : function(value){
        return this.reject(value);
      },
      reject : function (value) {
        when.callback = function(){
          return Promise.reject(value);
        };
        return this;
      }
    };
  };
  http.otherwise = function () {
    this.$$when.reverse();
    var result = this.when();
    this.$$when.reverse();
    return result;
  };
  http.expect = function (method, url, count) {
    var result = http.when(method, url);
    var when = http.$$when[http.$$when.length-1];
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
