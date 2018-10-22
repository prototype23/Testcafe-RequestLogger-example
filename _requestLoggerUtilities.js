import zlib from 'zlib';
/**
 * zip utilities for testcafe request logger.
 *
 * @see http://devexpress.github.io/testcafe/documentation/test-api/test-code-structure.html#using-test-controller-outside-of-test-code
 * @param {buffer} body
 */
export default class requestLoggerUtilities {
  // Class Methods

  /**
   * Unzips a response buffer from a testcafe requestlogger.🍓
   *
   * @param {*} t testcafe testController
   * @param {object}  options                   Any user params.
   * @param {buffer}  options.body              The response body of your request you want to unzip and convert to json.
   * @param {boolean} [options.toJson=false]    If true result will be return in json.
   * @param {boolean} [options.toString=false]  If true result will be return to string (using buffer.toString()).
   * @returns {promise} Returns a promise with the result. Result will be a buffer (default) a json or a string.
   */
  async unzipResponseBody (t, options) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(options.body, async (error, buff) => {
        if (error !== null) {
          return reject(error);
        }
        if (options.toJson === true) {
          return resolve(JSON.parse(buff.toString()));
        } else if (options.toString === true) {
          return resolve(buff.toString());
        } else {
          return resolve(buff);
        }
      });
    });
  }

  /**
   * Iterates throught a request logger and unzips any zipped response bodies. 🍒
   * Zipped bodies are dectected via the response.headers['content-encoding'] value which must be present with a value 'gzip'.
   * Your testcafe request logger should be initialized with `logResponseHeaders=true` otherwise no headers will not be present.
   * @implements {this.unzipResponseBody}
   * @see http://devexpress.github.io/testcafe/documentation/test-api/intercepting-http-requests/logging-http-requests.html#logger-properties
   * @param {*}      t                          Testcafe testController
   * @param {object} options                    Any user params.
   * @param {buffer} options.requestLogger      The request logger.
   * @param {boolean} [options.toJson=false]    If true response bodies will be replaced by a json.
   * @param {boolean} [options.toString=false]  If true response bodies will be replaced by astring (using buffer.toString()).
   * @returns {promise} Returns a promise so you can await the action to be finished. No actual data are returned.
   *                    Manipulates the options.requestLogger.requests directly!
   */
  async unzipLoggerResponses(t, options) {
    let self = this;
    let requests = options.requestLogger.requests;

    try {
      return Promise.all(requests.map(async (value, key) => {
        if (value.response && value.response.headers && value.response.headers['content-encoding'] === 'gzip'
          && Buffer.isBuffer(value.response.body)) {
            // Update the value directly on the logger reference!
            requests[key].response.body = await self.unzipResponseBody(t, {
              body: value.response.body,
              toJson: options.toJson,
              toString: options.toString
            });
        }
      }));
    } catch (er) {
      throw new Error(er);
    }
  }
}
