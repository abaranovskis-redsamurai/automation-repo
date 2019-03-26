
# coding: utf-8

# In[1]:


from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin

import pickle
import pandas as pd


# In[2]:


# Get headers for payload
headers = ['times_pregnant', 'glucose', 'blood_pressure', 'skin_fold_thick', 'serum_insuling', 'mass_index', 'diabetes_pedigree', 'age']


# In[3]:


# Use pickle to load in the pre-trained model
with open(f'diabetes-model.pkl', 'rb') as f:
    model = pickle.load(f)


# In[4]:


# Test model with data frame
input_variables = pd.DataFrame([[1, 106, 70, 28, 135, 34.2, 0.142, 22]],
                                columns=headers, 
                                dtype=float,
                                index=['input'])

# Get the model's prediction
prediction = model.predict(input_variables)
print("Prediction: ", prediction)
prediction_proba = model.predict_proba(input_variables)
print("Probabilities: ", prediction_proba)


# In[ ]:


app = Flask(__name__)
CORS(app)

@app.route("/katana-ml/api/v1.0/diabetes", methods=['POST'])
def predict():
    payload = request.json['data']
    values = [float(i) for i in payload.split(',')]
    
    input_variables = pd.DataFrame([values],
                                columns=headers, 
                                dtype=float,
                                index=['input'])

    # Get the model's prediction
    prediction_proba = model.predict_proba(input_variables)
    prediction = (prediction_proba[0])[1]
    
    ret = '{"prediction":' + str(float(prediction)) + '}'
    
    return ret

# running REST interface, port=5000 for direct test
if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=5000)

