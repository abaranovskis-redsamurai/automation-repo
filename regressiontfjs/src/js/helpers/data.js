define(['papa'],
    function (Papa) {

        function DataViewModel() {
            var self = this;

            self.trainFeatures = null;
            self.trainTarget = null;
            self.testFeatures = null;
            self.testTarget = null;

            self.loadData = () => {
                var dataUrl = getAbsoluteUrl('js/data/report_exec_times.csv');

                return new Promise(resolve => {
                    Papa.parse(dataUrl, {
                        download: true,
                        header: true,
                        complete: (results) => {
                            data = results['data'].map((row) => {
                                return Object.keys(row).map(key => parseFloat(row[key]));
                            });

                            var features = results['data'].map(report => ({
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
                            var target = results['data'].map(report => ({
                                exec_time: parseFloat(report.exec_time),
                            }));
                            
                            
                            features = features.map((row) => {
                                return Object.keys(row).map(key => parseFloat(row[key]));
                            });
                            target = target.map((row) => {
                                return Object.keys(row).map(key => parseFloat(row[key]));
                            });

                            shuffle(features, target);

                            self.trainFeatures = features.slice(0, 1200);
                            self.trainTarget = target.slice(0, 1200);
                            self.testFeatures = features.slice(1200, 1500);
                            self.testTarget = target.slice(1200, 1500);

                            resolve();
                        }
                    })
                });
            }

            var getAbsoluteUrl = (function () {
                var a;

                return function (url) {
                    if (!a) a = document.createElement('a');
                    a.href = url;

                    return a.href;
                };
            })();

            /**
              * Shuffles data and target (maintaining alignment) using Fisher-Yates
              * algorithm.flab
            */
            function shuffle(data, target) {
                let counter = data.length;
                let temp = 0;
                let index = 0;
                while (counter > 0) {
                    index = (Math.random() * counter) | 0;
                    counter--;
                    // data:
                    temp = data[counter];
                    data[counter] = data[index];
                    data[index] = temp;
                    // target:
                    temp = target[counter];
                    target[counter] = target[index];
                    target[index] = temp;
                }
            };

            self.determineMeanAndStddev = (data) => {
                const dataMean = data.mean(0);
                const diffFromMean = data.sub(dataMean);
                const squaredDiffFromMean = diffFromMean.square();
                const variance = squaredDiffFromMean.mean(0);
                const dataStd = variance.sqrt();
                return { dataMean, dataStd };
            }

            self.normalizeTensor = (data, dataMean, dataStd) => {
                return data.sub(dataMean).div(dataStd);
            }
        }

        return new DataViewModel();
    }
);
