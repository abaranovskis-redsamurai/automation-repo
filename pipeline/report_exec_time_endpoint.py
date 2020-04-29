
# coding: utf-8

# In[1]:


from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import pandas as pd
import numpy as np

import report_exec_time_model as report_model

import subprocess
from apscheduler.schedulers.background import BackgroundScheduler
import atexit


# In[2]:


# create scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# Using UTC time to schedule job, once per day.
scheduler.add_job(
    func=report_model.train_model,
    trigger='cron',
    hour='9', 
    minute='00')

# Shut down the scheduler when exiting the process
atexit.register(lambda: scheduler.shutdown())


# In[3]:


app = Flask(__name__)
CORS(app)

@app.route("/katana-ml/api/v1.0/predict/reporttime", methods=['POST'])
def predict():
    report_id = request.json['report_id']
    report_params = request.json['report_params']
    day_part = request.json['day_part']
    
    input_data = [[report_id, report_params, day_part]]
    result = report_model.run_predict(input_data)
    
    return str(result[0][0])

# running REST interface port=3000
if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=3000)

