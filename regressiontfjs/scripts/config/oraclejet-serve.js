/**
  Copyright (c) 2015, 2019, Oracle and/or its affiliates.
  The Universal Permissive License (UPL), Version 1.0
*/
'use strict';
/**
 * # oraclejet-serve.js
 * This script allows users to configure and customize the serve tasks.
 * Configurable tasks: connect, watch.
 * To configure a task, uncomment the corresponding sections below, and pass in your configurations.
 * Any options will be merged with default configuration found in node_modules/@oracle/oraclejet-tooling/lib/defaultconfig.js
 * Any fileList will replace the default configuration.
 */

module.exports = function () {
  return {
/**
 * # watch
 * This task watches a set of files and defines a series of customizable tasks if a change is detected.
 * Within the watch task config, by default there are three targets, sourceFiles, sass, themes. 
 * Users are encouraged to edit or add their own watch targets, be careful if rewrite the three default targets.
 * Within each watch target, users can specify three properties. 
 * 1. The files entry takes a list of glob patterns that identifies the set of files to watch
 * 2. The options.livereload specifies a boolean that indicates whether the browser should reload when files in this target are modified.
 * 3. The options.tasks property specifies custom commands to run. 'compileSass' and 'copyThemes' are reserved internal tasks.
 * Example commands: ['grunt copy', 'mocha test]. Once a change is detected, it will run grunt copy followed by mocha test
 * once the custom tasks completed, tooling will reload the browser if liverealod is set to true, then resume watching
 */
    // // Sub task watch default options
    // watch: {
    //   sourceFiles:
    //   {
    //     files: [],
    //     options: {
    //       livereload: true
    //     }
    //   },

    //   sass: {
    //     files: [],
    //     commands: ['compileSass']
    //   },

    //   themes: {
    //     files: [],
    //     options: {
    //       livereload: true
    //     },
    //     commands: ['copyThemes']
    //   },
    // }

/**
 * This is the web specific configuration. You can specify configurations targeted only for web apps. 
 * The web specific configurations will override the general configuration. 
 */
    web: {
/**
 * # connect
 * This task launches a web server for web App, does not work for hybrid App.
 * Support five connect options: 
 *   port, port number, default 8000
 *   hostname, a string of the domain name, default localhost
 *   livereload, a boolean for livereload, default true in dev mode, false in release mode (overwritten when )
 *   open, a boolean for wheather to launch browser, default to true
 *   base, a string of the target directory to be served, default to the staging area
 */
    // connect: {
    //   options: {}
    // },
    },

/**
 * This is the hybrid specific configuration. You can specify configurations targeted only for hybrid apps. 
 * The hybrid specific configurations will override the general configuration. 
 */
    hybrid: {
    }
  };
};
