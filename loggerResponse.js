import {RequestLogger, ClientFunction} from 'testcafe';
import requestLoggerUtilities from './_requestLoggerUtilities.js';

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

const requestLoggerUtils = new requestLoggerUtilities();

fixture('loggerResponse')
  .page(aSiteWithjQuery);

test
  .requestHooks(logger)('test', async t => {
    // Wait a little so we can open developer tools > Network tab.
    await t.wait(5000);

    // Make an ajax request.
    const response = await ajaxRequest();

    console.log('\nResponse taken via clientFunction:\n ', response);

    // Validate logger
    await t.expect(logger.contains(record => record.response.statusCode === 200)).ok();

    console.log('\nResponse taken by the logger:\n', logger.requests[0].response.body);

    // Unzip any zipped server responses on the logger.
    await requestLoggerUtils.unzipLoggerResponses(t, {requestLogger: logger});

    console.log('\nUnzipped Response taken by the logger:\n', logger.requests[0].response.body);
  });

