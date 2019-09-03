importScripts('https://cdn.jsdelivr.net/npm/setimmediate@1.0.5/setImmediate.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.2.7/dist/tf.min.js');
tf.setBackend('cpu');
var model;

onmessage = async function (event) {
    console.log('executing worker');
    seq = event.data;

    if (!model) {
        model = await createModel();
    }

    input = tf.tensor(seq);
    input = input.expandDims(0);

    predictOut = model.predict(input);
    score = predictOut.dataSync()[0];
    postMessage(score);

    predictOut.dispose();
};

async function createModel() {
    const model = await tf.loadLayersModel('ml/model.json')
    return model
}