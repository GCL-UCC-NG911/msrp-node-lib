'use strict';

module.exports = function (MsrpSdk) {
  class URI {
    constructor(uri) {
      this.secure = false;
      this.user = null;
      this.authority = '';
      this.port = 2855;
      this.sessionId = '';
      this.transport = 'tcp';
      this.address = '';
      if (uri) {
        this.uri = uri;
        this.parse(uri);
      }
    }

    parse(uri) {
      const colonIndex = uri.indexOf('://');
      if (colonIndex === -1) {
        throw new TypeError(`Invalid MSRP URI: ${uri}`);
      }
      // Extract the scheme first
      const scheme = uri.substring(0, colonIndex);
      switch (scheme.toLowerCase()) {
        case 'msrp':
          this.secure = false;
          break;
        case 'msrps':
          this.secure = true;
          break;
        default:
          throw new TypeError(`Invalid MSRP URI (unknown scheme): ${uri}`);
      }
      // Start by assuming that the authority is everything between "://" and "/"
      const pathIndex = uri.indexOf('/', colonIndex + 3);
      if (pathIndex === -1) {
        throw new TypeError(`Invalid MSRP URI (no session ID): ${uri}`);
      }
      this.authority = uri.substring(colonIndex + 3, pathIndex);
      // If there's an "@" symbol in the authority, extract the user
      const atIndex = this.authority.indexOf('@');
      if (atIndex !== -1) {
        this.user = this.authority.substring(0, atIndex);
        this.authority = this.authority.substring(atIndex + 1);
      }
      // If there's an ":" symbol in the authority, extract the port
      const portSepIndex = this.authority.indexOf(':');
      if (portSepIndex !== -1) {
        this.port = +this.authority.substring(portSepIndex + 1);
        this.authority = this.authority.substring(0, portSepIndex);
      }
      // Finally, separate the session ID from the transport
      const semicolonIndex = uri.indexOf(';', colonIndex + 3);
      if (semicolonIndex === -1) {
        throw new TypeError(`Invalid MSRP URI (no transport): ${uri}`);
      }
      this.sessionId = uri.substring(pathIndex + 1, semicolonIndex);
      this.transport = uri.substring(semicolonIndex + 1);
      this.address = `${this.authority}:${this.port}`;
      return true;
    }

    toString() {
      if (this.uri) {
        // Return the cached URI
        return this.uri;
      }
      let uri = this.secure ? 'msrps://' : 'msrp://';
      if (this.user) {
        uri += `${this.user}@`;
      }
      uri += this.authority;
      if (this.port) {
        uri += `:${this.port}`;
      }
      uri += `/${this.sessionId};${this.transport}`;
      this.uri = uri;
      return uri;
    }

    equals(uri) {
      if (typeof uri === 'string') {
        uri = new MsrpSdk.URI(uri);
      }
      if (!(uri instanceof Object)) {
        return false;
      }
      if (uri.secure !== this.secure) {
        return false;
      }
      // Strictly we should be checking whether percent-encoding normalisation
      // is needed, but it's not likely to be needed.
      if (uri.authority.toLowerCase() !== this.authority.toLowerCase()) {
        return false;
      }
      if (uri.port !== this.port) {
        return false;
      }
      if (uri.sessionId !== this.sessionId) {
        return false;
      }
      return uri.transport.toLowerCase() === this.transport.toLowerCase();
    }
  }

  MsrpSdk.URI = URI;
};
