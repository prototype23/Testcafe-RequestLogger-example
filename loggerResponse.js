import {RequestLogger, ClientFunction} from 'testcafe';
import zlib from 'zlib';

// https://jsonplaceholder.typicode.com/
const apiCall = 'http://jsonplaceholder.typicode.com/users/1'; // You can use the https call: 'https://jsonplaceholder.typicode.com/users/1';
const aSiteWithjQuery = 'https://jquery.com/';                 // You can place a local page of yours that has jQuery.

// My settings are these, i know logRequestBody and logResponseHeaders details are not used on this test.
const logger = RequestLogger(apiCall, {
  logRequestBody: true,
  logResponseBody: true,
  stringifyResponseBody: false,
  logResponseHeaders: true
});

const ajaxRequest = ClientFunction(() => {
  /* global jQuery, testUrl */
  console.log('Requesting ' + testUrl);

  return new Promise(resolve => {
    jQuery.get(testUrl).always(function(response) {
      console.log(response);
      resolve(response);
    });
  });
}, {
  dependencies: {
    testUrl: apiCall
  }
});
/**
 *
 * @param {buffer} body
 */
const getBody = async body => new Promise((resolve, reject) => {
  zlib.gunzip(body, async (error, buff) => {
    if (error !== null) {
      return reject(error);
    }
    return resolve(JSON.parse(buff.toString()));
  });
});

fixture('loggerResponse')
  .page(aSiteWithjQuery);

test
  .requestHooks(logger)('test', async t => {
    // Wait a little so we can open developer tools > Network tab.
    await t.wait(5000);

    // Make an ajax request.
    const response = await ajaxRequest();

    console.log('Response taken via clientFunction:\n ', response);

    // Wait a little (not needed in specific test, we have a promised client function, but added for testing).
    // await t.wait(5000);

    // Validate logger
    await t.expect(logger.contains(record => record.response.statusCode === 200)).ok();

    const logRecord = logger.requests[0];

    console.log('\n', 'Response taken by the logger:\n', logRecord.response.body);

    const unZippedBody = await (getBody(logRecord.response.body));

    console.log('\n', 'Response taken by the logger (unZipped):\n', unZippedBody);

    // Try to make it json (it will fail)
    // console.log(JSON.parse(unZippedBody));

    // Wait one minute, incase test did not start with -debug-on-fail
    await t.wait(60000);
  });

