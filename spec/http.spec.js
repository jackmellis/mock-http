import test from 'ava-spec';
import Sinon from 'sinon';
import mockHttp from '../src';

test.beforeEach(function (t) {
  let http = mockHttp();
  let sinon = Sinon.sandbox.create();

  t.context = {http, sinon};
});
test.afterEach(function (t) {
  t.context.sinon.restore();
});

test.group('methods', function(test){
  test('sends a get request', function (t) {
    let {http} = t.context;
    let spy = t.context.spy = t.context.sinon.spy();
    t.context.http.when('get', 'api/1').call(spy);

    return http.get('api/1').then(() => {
      t.true(spy.called);
    });
  });
  test('sends a put request', function (t) {
    let {http} = t.context;
    let spy = t.context.spy = t.context.sinon.spy();
    t.context.http.when('put', 'api/1').call(spy);

    return http.put('api/1').then(() => {
      t.true(spy.called);
    });
  });
  test('sends a post request', function (t) {
    let {http} = t.context;
    let spy = t.context.spy = t.context.sinon.spy();
    t.context.http.when('post', 'api/1').call(spy);

    return http.post('api/1').then(() => {
      t.true(spy.called);
    });
  });
  test('sends a delete request', function (t) {
    let {http} = t.context;
    let spy = t.context.spy = t.context.sinon.spy();
    t.context.http.when('delete', 'api/1').call(spy);

    return http.delete('api/1').then(() => {
      t.true(spy.called);
    });
  });
  test('sends a patch request', function (t) {
    let {http} = t.context;
    let spy = t.context.spy = t.context.sinon.spy();
    t.context.http.when('patch', 'api/1').call(spy);

    return http.patch('api/1').then(() => {
      t.true(spy.called);
    });
  });
  test('sends an options request', function (t) {
    let {http} = t.context;
    let spy = t.context.spy = t.context.sinon.spy();
    t.context.http.when('options', 'api/1').call(spy);

    return http.options('api/1').then(() => {
      t.true(spy.called);
    });
  });
});

test.group('strict mode', function(test){;
  test('throws an error when no response is found in strict mode', function (t) {
    let {http} = t.context;

    return http.get('api/1').then(() => {
      t.fail('Should not resolve!');
    }, () => {
      t.pass();
    });
  });
  test('throws an error when no responses match in strict mode', function (t) {
    let {http} = t.context;
    http.when('delete', 'api/1');
    http.when(/delete/, 'api/1');
    http.when('delete', /api\/1/);
    http.when(/delete/, /api\/1/);
    http.when('get', 'api/2');
    http.when(/get/, 'api/2');
    http.when('get', /api\/2/);
    http.when(/get/, /api\/2/);

    return http.get('api/1').then(() => t.fail(), () => t.pass());
  });
  test('does not throw an error if not in strict mode', function (t) {
    let {http} = t.context;
    http.strict = false;

    return http.get('api/1').then(() => {
      t.pass();
    }, (e) => {
      t.fail(e);
    });
  });
  test('otherwise is called when no response matches', function (t) {
    let {http} = t.context;
    http.otherwise();

    return http.get('api/1').then(() => {
      t.pass();
    }, (e) => {
      t.fail();
    });
  });
});

test.group('responses', function(test){
  function setup(t){
    t.context.http.when('delete', 'api/1');
    t.context.http.when('get', 'api/1').return('returned');
    t.context.http.when('post', 'api/1').call(() => 'called');
    t.context.http.when('put', 'api/1').reject('rejected');
    t.context.http.when('options', 'api/1').throw('rejected');
    t.context.http.when('patch', 'api/1').stop();
    return t.context;
  }
  test('returns a default resolved promise', function (t) {
    let {http} = setup(t);
    return http({method : 'DELETE', url : 'api/1'}).then(response => {
      t.is(response, undefined);
    });
  });
  test('resolves with a value', function (t) {
    let {http} = setup(t);
    return http({method : 'GET', url : 'api/1'}).then(response => {
      t.is(response, 'returned');
    });
  });
  test('triggers a callback', function (t) {
    let {http} = setup(t);
    return http({method : 'post', url : 'api/1'}).then(response => {
      t.is(response, 'called');
    });
  });
  test.cb('does not resolve', function (t) {
    let {http} = setup(t);
    http({method : 'patch', url : 'api/1'}).then(() => t.fail(), () => t.fail());

    setTimeout(() => {t.end();}, 500);
  });
  test('rejects the promise', function (t) {
    let {http} = setup(t);
    return http({method : 'put', url : 'api/1'}).then(() => {
      t.fail();
    }, () => {
      t.pass();
    });
  });
  test('throws the promise', function (t) {
    let {http} = setup(t);
    return http({method : 'options', url : 'api/1'}).then(() => {
      t.fail();
    }, () => {
      t.pass();
    });
  });
});

test.group('matching', function (test) {
  test('matches on strings', function (t) {
    let {http} = t.context;
    http.when('get', 'api/1');

    return http.get('api/1').then(() => t.pass());
  });
  test('matches on regular expressions', function (t) {
    let {http} = t.context;
    http.when(/get/, /api\/\d/);

    return http.get('api/1').then(() => t.pass());
  });
  test('matches only on url', function (t) {
    let {http} = t.context;
    http.when('api/1');

    return http.get('api/1').then(() => t.pass());
  });
});

test('if using a flushable promise object, calls flush', t => {
  let {sinon} = t.context;
  Promise.prototype.flush = sinon.spy();

  let http = mockHttp();

  http.otherwise();

  http.get('api/1');
  t.false(Promise.prototype.flush.called);

  http.immediate = true;

  http.get('api/1');
  t.true(Promise.prototype.flush.called);

  delete Promise.prototype.flush;
});
test('if using a flushable object, http.flush will flush all promises', t => {
  let {sinon} = t.context;
  Promise.prototype.flush = sinon.spy();

  let http = mockHttp();

  http.otherwise();

  http.get('api/1');
  t.false(Promise.prototype.flush.called);
  http.get('api/1');
  t.false(Promise.prototype.flush.called);

  http.flush();

  t.true(Promise.prototype.flush.called);
  t.true(Promise.prototype.flush.calledTwice);

  delete Promise.prototype.flush;
});
