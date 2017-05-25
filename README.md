# mock-http-client
Create a mock http object for stubbing and simulating ajax requests in tests.

[![npm version](https://badge.fury.io/js/mock-http-client.svg)](https://badge.fury.io/js/mock-http-client)
[![Build Status](https://travis-ci.org/jackmellis/mock-http-client.svg?branch=master)](https://travis-ci.org/jackmellis/mock-http-client)
[![Code Climate](https://codeclimate.com/github/jackmellis/mock-http-client/badges/gpa.svg)](https://codeclimate.com/github/jackmellis/mock-http-client)
[![Test Coverage](https://codeclimate.com/github/jackmellis/mock-http-client/badges/coverage.svg)](https://codeclimate.com/github/jackmellis/mock-http-client/coverage)

Install:
```
npm install mock-http-client --save-dev
```

Create mock http and pass it into your source code:
```js
import mockHttp from 'mock-http-client';
const http = mockHttp();

(myService || myComponent || myRewiredModule || mySystemUnderTest).http = http;

// http exposes a fairly common api:
http({method : 'post', url : '/api/1', data : {}});
http.get('/api/1');
http.put('/api/1', {});
http.post('/api/1', {});
http.patch('/api/1', {});
http.delete('/api/1', {});
```

Create responses:
```js
// create responses for specific queries
http.when('get', '/api/1').return({
  status : 200,
  data : {}
});
http.when('delete', '/api/1').reject(new Error());

// create responses for patterns
http.when(/\/api\/\d+/).call(config => {
  return {
    status : 204,
    data : config.data
  };
});

// expect requests and error if they are not met
http.expect('/api/3');
// run your code here
http.assert();
```

Docs:  
https://jackmellis.gitbooks.io/vuenit/content/http/introduction.html
