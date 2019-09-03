/**
  Copyright (c) 2015, 2019, Oracle and/or its affiliates.
  The Universal Permissive License (UPL), Version 1.0
*/
'use strict';

module.exports = function () {
  return new Promise((resolve) => {
    console.log('Running after_app_create hook.');
    resolve();
  });
};
