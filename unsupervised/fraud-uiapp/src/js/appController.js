/**
 * @license
 * Copyright (c) 2014, 2019, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'knockout', 'ojs/ojarraydataprovider', 'ojs/ojconverter-datetime',
  'ojs/ojconverter-number', 'ojs/ojknockout', 'ojs/ojchart', 'ojs/ojformlayout', 'ojs/ojlabelvalue', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojinputnumber'],
  function (ResponsiveUtils, ResponsiveKnockoutUtils, ko, ArrayDataProvider, DateTimeConverter, NumberConverter) {
    function ControllerViewModel() {
      var self = this;
      let baseURL = 'http://localhost:5000/katana-ml/api/v1.0/fraud';

      self.fraud = ko.observableArray();
      self.fraudDataProvider = new ArrayDataProvider(self.fraud, { keyAttributes: 'id' });
      self.yAxisClaimsFraud = ko.observable();
      self.fraudThreshold = ko.observable(0.01);
      self.validClaims = ko.observable(0);
      self.fraudulentClaims = ko.observable(0);
      self.falseFraudulentClaims = ko.observable(0);
      self.falsePositiveClaims = ko.observable(0);

      self.decimalConverter =
        new NumberConverter.IntlNumberConverter({
          style: 'decimal',
          minimumIntegerDigits: 1,
          minimumFractionDigits: 2,
          maximumFractionDigits: 5,
          useGrouping: false
        });

      self.processFraud = function () {
        let fetchURL = baseURL + '/process';

        fetch(fetchURL, {
          method: 'post',
          headers: {
            "Content-type": "application/json"
          },
          body: '{'
            + '"fraud_threshold": ' + self.fraudThreshold() +
            '}'
        }).then(function (response) {
          if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' + response.status);
            return;
          }

          self.fraud.removeAll();
          response.json().then(function (data) {
            let topValidClaim = data[0].non_fraud_cost_max;

            fraudulentClaimsArray = [];
            falseFraudulentClaimsArray = [];
            falseValidClaimsArray = [];

            data.forEach(function (item) {
              let seriesName = 'Fraudulent Claim';
              if (item.fraud_predict == 1) {
                seriesName = 'Fraudulent Claim';
                fraudulentClaimsArray.push({ 'id': item.transaction_id, 'series': seriesName, 'group': item.transaction_id, 'x': item.transaction_id, 'y': item.claim_cost });
              }
              if (item.fraud_predict == 2) {
                seriesName = 'False Fraudulent Claim';
                falseFraudulentClaimsArray.push({ 'id': item.transaction_id, 'series': seriesName, 'group': item.transaction_id, 'x': item.transaction_id, 'y': item.claim_cost });
              }
              if (item.fraud_predict == 3) {
                seriesName = 'False Valid Claim';
                falseValidClaimsArray.push({ 'id': item.transaction_id, 'series': seriesName, 'group': item.transaction_id, 'x': item.transaction_id, 'y': item.claim_cost });
              }
            })

            fraudulentClaimsArray.forEach(function (e) {
              self.fraud.push({ 'id': e.id, 'series': e.series, 'group': e.group, 'x': e.x, 'y': e.y });
            })

            falseFraudulentClaimsArray.forEach(function (e) {
              self.fraud.push({ 'id': e.id, 'series': e.series, 'group': e.group, 'x': e.x, 'y': e.y });
            })

            falseValidClaimsArray.forEach(function (e) {
              self.fraud.push({ 'id': e.id, 'series': e.series, 'group': e.group, 'x': e.x, 'y': e.y });
            })

            var topValidClaimSeries = {
              baselineScaling: 'min',
              referenceObjects: [
                {
                  text: 'Top Valid Claim', type: 'line', value: topValidClaim, color: '#000000', displayInLegend: 'on', lineWidth: 1, location: 'back', lineStyle: 'dashed', shortDesc: 'Top Valid Claim'
                }]
            };
            self.yAxisClaimsFraud(topValidClaimSeries);
          })
        })
      }

      self.processFraud();

      self.processFraudStats = function () {
        let fetchURL = baseURL + '/stats';

        fetch(fetchURL, {
          method: 'post',
          headers: {
            "Content-type": "application/json"
          },
          body: '{'
            + '"fraud_threshold": ' + self.fraudThreshold() +
            '}'
        }).then(function (response) {
          if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' + response.status);
            return;
          }

          response.json().then(function (data) {
            self.validClaims(0);
            self.fraudulentClaims(0);
            self.falseFraudulentClaims(0);
            self.falsePositiveClaims(0);

            data.forEach(function (item) {
              if (item.unique_values === 0) {
                self.validClaims(item.counts);
              }
              if (item.unique_values === 1) {
                self.fraudulentClaims(item.counts);
              }
              if (item.unique_values === 2) {
                self.falseFraudulentClaims(item.counts);
              }
              if (item.unique_values === 3) {
                self.falsePositiveClaims(item.counts);
              }
            })
          })
        })
      }

      self.processFraudStats();

      self.runFraud = function (event) {
        self.processFraud();
        self.processFraudStats();
      }

      // Footer
      function footerLink(name, id, linkTarget) {
        this.name = name;
        this.linkId = id;
        this.linkTarget = linkTarget;
      }
      self.footerLinks = ko.observableArray([
        new footerLink('About Katana ML', 'aboutKatana', 'https://katanaml.io/'),
        new footerLink('GitHub', 'github', 'https://github.com/katanaml')
      ]);
    }

    return new ControllerViewModel();
  }
);
