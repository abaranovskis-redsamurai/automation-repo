/**
 * @license
 * Copyright (c) 2014, 2019, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
'use strict';

/**
 * Example of Require.js boostrap javascript
 */

requirejs.config(
{
  baseUrl: 'js',

  // Path mappings for the logical module names
  // Update the main-release-paths.json for release mode when updating the mappings
  paths:
  //injector:mainReleasePaths
  {
    'knockout': 'libs/knockout/knockout-3.5.0.debug',
    'jquery': 'libs/jquery/jquery-3.4.1',
    'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.12.1',
    'promise': 'libs/es6-promise/es6-promise',
    'hammerjs': 'libs/hammer/hammer-2.0.8',
    'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.0',
    'ojs': 'libs/oj/v7.1.0/debug',
    'ojL10n': 'libs/oj/v7.1.0/ojL10n',
    'ojtranslations': 'libs/oj/v7.1.0/resources',
    'text': 'libs/require/text',
    'signals': 'libs/js-signals/signals',
    'customElements': 'libs/webcomponents/custom-elements.min',
    'proj4': 'libs/proj4js/dist/proj4-src',
    'css': 'libs/require-css/css',
    'touchr': 'libs/touchr/touchr'
  }
  //endinjector
}
);

/**
 * A top-level require call executed by the Application.
 * Although 'knockout' would be loaded in any case (it is specified as a  dependency
 * by some modules), we are listing it explicitly to get the reference to the 'ko'
 * object in the callback
 */
require(['ojs/ojbootstrap', 'knockout', 'appController', 'ojs/ojknockout', 'ojs/ojbutton', 'ojs/ojtoolbar', 'ojs/ojmenu'],
  function (Bootstrap, ko, app) { // this callback gets executed when all required modules are loaded

      Bootstrap.whenDocumentReady().then(
        function() {
          function init() {
            // Bind your ViewModel for the content of the whole page body.
            ko.applyBindings(app, document.getElementById('globalBody'));
          }

          // If running in a hybrid (e.g. Cordova) environment, we need to wait for the deviceready
          // event before executing any code that might interact with Cordova APIs or plugins.
          if (document.body.classList.contains('oj-hybrid')) {
            document.addEventListener("deviceready", init);
          } else {
            init();
          }
        }
      );
    }
);
