# Changelog

## 0.3.0
- Calling `expect(url, count)` was failing as it assumed url was a method and count was a url. [4](https://github.com/jackmellis/mock-http/issues/4)
- Calling `when(/some(.*)regex).call(config => {})` now includes the regex matches in the config object. [6](https://github.com/jackmellis/mock-http/issues/6)
- Added a `next` method so you can trigger previously-defined routes i.e. `when('/some/path').call(spy).next();` [5](https://github.com/jackmellis/mock-http/issues/5)
