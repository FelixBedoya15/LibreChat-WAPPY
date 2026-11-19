/**
 * Lazy Proxy around `googleapis` so Node.js does NOT synchronously parse all 500+ Google APIs
 * (~150 MB RAM + thousands of disk reads) during server startup.
 * Loads `googleapis` on first actual property access (e.g., google.auth, google.drive, google.gmail).
 */
let _googleInstance = null;

function getGoogle() {
  if (!_googleInstance) {
    _googleInstance = require('googleapis').google;
  }
  return _googleInstance;
}

const google = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getGoogle();
      const value = instance[prop];
      return typeof value === 'function' ? value.bind(instance) : value;
    },
    has(_target, prop) {
      return prop in getGoogle();
    },
    ownKeys() {
      return Reflect.ownKeys(getGoogle());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(getGoogle(), prop);
    },
  },
);

module.exports = { google, getGoogle };
