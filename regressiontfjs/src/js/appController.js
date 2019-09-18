/*
 * Your application specific code will go here
 */
define(['ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'knockout', 'tfjs', 'helpers/data', 'ojs/ojarraydataprovider', 'ojs/ojknockout',
  'ojs/ojbutton', 'ojs/ojchart', 'ojs/ojformlayout', 'ojs/ojlabel', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojradioset',
  'ojs/ojvalidationgroup', 'ojs/ojmenu', 'ojs/ojoption'],
  function (ResponsiveUtils, ResponsiveKnockoutUtils, ko, tf, dataHelper, ArrayDataProvider) {
    function ControllerViewModel() {
      var self = this;

      self.statusInfo = ko.observable();
      self.epochInfo = ko.observable();
      self.finalTrainSetLoss = ko.observable();
      self.finalValidationSetLoss = ko.observable();
      self.testSetLoss = ko.observable();
      self.baselineLoss = ko.observable();
      self.averageGeneralTime = ko.observable();
      self.predictionOffTime = ko.observable();
      self.epochInfoVisible = ko.observable(false);
      self.finalResultInfoVisible = ko.observable(false);
      self.trainingChartVisible = ko.observable(false);
      self.trainButtonDisabled = ko.observable(true);
      self.predictButtonDisabled = ko.observable(true);

      self.reportId = ko.observable("1");
      self.reportParams = ko.observable(15);
      self.reportExecSlot = ko.observable("3");
      self.reportExecTime = ko.observable(425);

      self.reportIdP = ko.observable("2");
      self.reportParamsP = ko.observable(0);
      self.reportExecSlotP = ko.observable("2");
      self.reportExecTimeP = ko.observable();

      self.epochInfoT = ko.observable();
      self.finalTrainSetLossT = ko.observable();
      self.testSetLossT = ko.observable();
      self.predictionOffTimeT = ko.observable();
      self.trainingChartVisibleT = ko.observable(false);
      self.epochInfoVisibleT = ko.observable(false);
      self.finalResultInfoVisibleT = ko.observable(false);

      self.groupValidP = ko.observable();
      self.groupValidT = ko.observable();

      self.trainedModelAvailable = ko.observable(false);

      var tensors = {};
      var trainLogs = [];
      var trainLogsT = [];

      var NUM_EPOCHS = 50;
      var BATCH_SIZE = 10;
      var LEARNING_RATE = 0.001;

      self.trainingProgress = ko.observableArray();
      self.trainingProgressDataProvider = new ArrayDataProvider(self.trainingProgress, { keyAttributes: 'id' });
      self.trainingProgressT = ko.observableArray();
      self.trainingProgressDataProviderT = new ArrayDataProvider(self.trainingProgressT, { keyAttributes: 'id' });

      // Convert loaded data into tensors and creates normalized versions of the features.
      arraysToTensors = () => {
        tensors.rawTrainFeatures = tf.tensor2d(dataHelper.trainFeatures);
        tensors.trainTarget = tf.tensor2d(dataHelper.trainTarget);
        tensors.rawTestFeatures = tf.tensor2d(dataHelper.testFeatures);
        tensors.testTarget = tf.tensor2d(dataHelper.testTarget);

        // Normalize mean and standard deviation of data.
        var { dataMean, dataStd } = dataHelper.determineMeanAndStddev(tensors.rawTrainFeatures);
        tensors.trainFeatures = dataHelper.normalizeTensor(tensors.rawTrainFeatures, dataMean, dataStd);
        tensors.testFeatures = dataHelper.normalizeTensor(tensors.rawTestFeatures, dataMean, dataStd);
        tensors.dataMean = dataMean;
        tensors.dataStd = dataStd;
      };

      convertInputToTensor = (input, targetIncluded) => {
        var features = input.map(report => ({
          report_params: parseFloat(report.report_params),
          report_1: parseFloat(report.report_id) === 1 ? 1 : 0,
          report_2: parseFloat(report.report_id) === 2 ? 1 : 0,
          report_3: parseFloat(report.report_id) === 3 ? 1 : 0,
          report_4: parseFloat(report.report_id) === 4 ? 1 : 0,
          report_5: parseFloat(report.report_id) === 5 ? 1 : 0,
          day_morning: parseFloat(report.day_part) === 1 ? 1 : 0,
          day_midday: parseFloat(report.day_part) === 2 ? 1 : 0,
          day_afternoon: parseFloat(report.day_part) === 3 ? 1 : 0,
        }));

        features = features.map((row) => {
          return Object.keys(row).map(key => parseFloat(row[key]));
        });

        tensors.rawInputFeatures = tf.tensor2d(features);
        tensors.inputFeatures = dataHelper.normalizeTensor(tensors.rawInputFeatures, tensors.dataMean, tensors.dataStd);

        if (targetIncluded) {
          var target = input.map(report => ({
            exec_time: parseFloat(report.exec_time),
          }));

          target = target.map((row) => {
            return Object.keys(row).map(key => parseFloat(row[key]));
          });

          tensors.inputTarget = tf.tensor2d(target);
        }
      }

      constructModel = () => {
        const model = tf.sequential();
        model.add(tf.layers.dense({
          inputShape: [dataHelper.trainFeatures[0].length],
          units: 25,
          activation: 'sigmoid',
          kernelInitializer: 'leCunNormal'
        }));
        model.add(tf.layers.dense({
          units: 25,
          activation: 'sigmoid',
          kernelInitializer: 'leCunNormal'
        }));
        model.add(tf.layers.dense({ units: 1 }));

        model.summary();
        return model;
      };

      self.executeTraining = async (event) => {
        self.statusInfo('Running training process. Learning rate: 0.001. Batch size: 10. Epochs: 50.');
        self.finalResultInfoVisible(false);
        self.trainingChartVisible(false);
        self.predictButtonDisabled(true);
        self.trainButtonDisabled(true);

        self.trainingProgress.removeAll();

        model = constructModel();
        model.compile({ optimizer: tf.train.sgd(LEARNING_RATE), loss: 'meanSquaredError' });

        await model.fit(tensors.trainFeatures, tensors.trainTarget, {
          batchSize: BATCH_SIZE,
          epochs: NUM_EPOCHS,
          shuffle: true,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: async (epoch, logs) => {
              if (self.epochInfoVisible() !== true) {
                self.epochInfoVisible(true);
              }

              e = epoch + 1;
              self.epochInfo('Epoch ' + e + " of " + NUM_EPOCHS + " completed. Chart is displayed when loss is < 300.");
              trainLogs.push(logs);

              if (logs.loss < 300) {
                self.trainingChartVisible(true);
                self.trainingProgress.push({ "id": e, "series": "loss", "epoch": e, "value": logs.loss });
                self.trainingProgress.push({ "id": e, "series": "val_loss", "epoch": e, "value": logs.val_loss });
              }
            }
          }
        });

        self.trainedModelAvailable(true);
        self.statusInfo('Evaluating model...');

        result = model.evaluate(tensors.testFeatures, tensors.testTarget, { batchSize: BATCH_SIZE });
        testLoss = result.dataSync()[0];

        trainLoss = trainLogs[trainLogs.length - 1].loss;
        valLoss = trainLogs[trainLogs.length - 1].val_loss;

        self.epochInfoVisible(false);
        self.finalResultInfoVisible(true);
        self.predictButtonDisabled(false);
        self.trainButtonDisabled(false);

        self.finalTrainSetLoss(trainLoss);
        self.finalValidationSetLoss(valLoss);
        self.testSetLoss(testLoss);
        self.predictionOffTime(Math.sqrt(testLoss));

        await model.save('indexeddb://report-exec-time-model');

        self.statusInfo('Model saved');
      }

      self.selectExistingModel = async (event) => {
        if (event.target.value === 'model') {
          self.predictButtonDisabled(false);
          self.trainButtonDisabled(false);
          self.statusInfo('Model selected');
        }
      }

      self.predictWithExistingModel = async (event) => {
        var tracker = document.getElementById("trackerP");

        if (tracker.valid === "valid") {
          model = await tf.loadLayersModel('indexeddb://report-exec-time-model');

          input = [{
            report_id: parseFloat(self.reportIdP()),
            report_params: self.reportParamsP(),
            day_part: parseFloat(self.reportExecSlotP())
          }];

          convertInputToTensor(input);

          res = model.predict(tensors.inputFeatures);
          score = res.dataSync()[0];
          self.reportExecTimeP(score);

          res.dispose();
        } else {
          tracker.showMessages();
          tracker.focusOn("@firstInvalidShown");
        }
      }

      self.runTransferLearning = async (event) => {
        var tracker = document.getElementById("trackerT");

        if (tracker.valid === "valid") {
          self.statusInfo('Running transfer learning process...');

          self.trainingChartVisibleT(true);
          self.finalResultInfoVisibleT(false);

          self.trainingProgressT.removeAll();

          model = await tf.loadLayersModel('indexeddb://report-exec-time-model');

          model.layers[0].trainable = false;

          model.compile({
            loss: 'meanSquaredError',
            optimizer: tf.train.sgd(LEARNING_RATE)
          });

          model.summary();

          input = [{
            report_id: parseFloat(self.reportId()),
            report_params: self.reportParams(),
            day_part: parseFloat(self.reportExecSlot()),
            exec_time: self.reportExecTime()
          }];

          convertInputToTensor(input, 'Y');

          await model.fit(tensors.inputFeatures, tensors.inputTarget, {
            batchSize: BATCH_SIZE,
            epochs: NUM_EPOCHS,
            shuffle: true,
            callbacks: {
              onEpochEnd: async (epoch, logs) => {
                if (self.epochInfoVisibleT() !== true) {
                  self.epochInfoVisibleT(true);
                }

                e = epoch + 1;
                self.epochInfoT('Epoch ' + e + " of " + NUM_EPOCHS + " completed.");
                trainLogsT.push(logs);

                self.trainingProgressT.push({ "id": e, "series": "loss", "epoch": e, "value": logs.loss });
              }
            }
          });

          self.epochInfoVisibleT(false);
          self.finalResultInfoVisibleT(true);

          self.statusInfo('Evaluating model...');

          result = model.evaluate(tensors.testFeatures, tensors.testTarget, { batchSize: BATCH_SIZE });
          testLoss = result.dataSync()[0];

          trainLoss = trainLogsT[trainLogsT.length - 1].loss;

          self.finalTrainSetLossT(trainLoss);
          self.testSetLossT(testLoss);
          self.predictionOffTimeT(Math.sqrt(testLoss));

          await model.save('indexeddb://report-exec-time-model');

          self.statusInfo('Model saved');
        } else {
          tracker.showMessages();
          tracker.focusOn("@firstInvalidShown");
        }
      }

      computeBaseline = () => {
        avgTime = tf.mean(tensors.trainTarget);
        baseline = tf.mean(tf.pow(tf.sub(tensors.testTarget, avgTime), 2));
        self.baselineLoss(baseline.dataSync()[0]);
        self.averageGeneralTime(avgTime.dataSync()[0]);
      };

      $(document).ready(async () => {
        console.log('TensorFlow.js: ' + tf.version.tfjs);

        model = null;
        try {
          model = await tf.loadLayersModel('indexeddb://report-exec-time-model');
        } catch(err) {}

        dataHelper.loadData().then(() => {
          self.statusInfo('Data loaded, converting to tensors.');
          arraysToTensors();
          setTimeout(function () {
            self.statusInfo('Data is now available as tensors. Click a train button to begin.');
            self.trainButtonDisabled(false);

            if (model !== null) {
              self.trainedModelAvailable(true);
            } else {
              self.trainedModelAvailable(false);
            }
          }, 1000);

          computeBaseline();
        });
      });

      $('#repId').keypress(function (event) {
        return processNumberInput(event);
      });

      $('#repParams').keypress(function (event) {
        return processNumberInput(event);
      });

      $('#repExecTime').keypress(function (event) {
        return processNumberInput(event);
      });

      $('#repIdP').keypress(function (event) {
        return processNumberInput(event);
      });

      $('#repParamsP').keypress(function (event) {
        return processNumberInput(event);
      });

      function processNumberInput(event) {
        var charCode = (event.which) ? event.which : event.keyCode;
        var char = String.fromCharCode(charCode);
        // Only allow ".0123456789" (and non-display characters)
        var replacedValue = char.replace(/[^0-9\.]/g, '');
        if (char !== replacedValue)
          return false;

        return true;
      }
    }

    return new ControllerViewModel();
  }
);
