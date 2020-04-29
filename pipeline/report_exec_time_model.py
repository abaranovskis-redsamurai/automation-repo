
# coding: utf-8

# In[2]:


import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import datetime
import math
import calendar;
import time;
import shutil
import os

import tensorflow as tf

from tensorflow import feature_column
from tensorflow.keras import layers

from sklearn.model_selection import train_test_split

print(tf.__version__)


# In[3]:


def plot_history(history):
    hist = pd.DataFrame(history.history)
    hist['epoch'] = history.epoch
    #hist = hist.loc[150:]

    plt.figure()
    plt.xlabel('Epoch')
    plt.ylabel('Mean Abs Error [ReportTime]')
    plt.plot(hist['epoch'], hist['mae'],
           label='Train Error')
    plt.plot(hist['epoch'], hist['val_mae'],
           label = 'Val Error')
    plt.ylim([0,500])
    plt.legend()

    plt.figure()
    plt.xlabel('Epoch')
    plt.ylabel('Mean Square Error [$ReportTime^2$]')
    plt.plot(hist['epoch'], hist['mse'],
           label='Train Error')
    plt.plot(hist['epoch'], hist['val_mse'],
           label = 'Val Error')
    plt.ylim([0,300000])
    plt.legend()
    plt.show()


# In[4]:


def copyDirectory(src, dest):
    try:
        shutil.copytree(src, dest)
    # Directories are the same
    except shutil.Error as e:
        print('Directory not copied. Error: %s' % e)
    # Any error saying that the directory doesn't exist
    except OSError as e:
        print('Directory not copied. Error: %s' % e)


# In[5]:


def get_immediate_subdirectories(a_dir):
    return [name for name in os.listdir(a_dir)
            if os.path.isdir(os.path.join(a_dir, name))]


# In[11]:


def fetch_data():
    # read training data
    # report_id - ID to identify report
    # report_params - number of parameters to execute report (when more params specified - report will be generated faster)
    # day_part - when report is executed (morning, midday or afternoon) - there is less load in the morning and in the afternoon reports are generated slower
    # exec_time - time spent to produce report
    
    # Suppose data is changed and we need to re-train model
    column_names = ['report_id','report_params','day_part','exec_time']
    dataframe = pd.read_csv('report_exec_times.csv')
    dataframe_test = pd.read_csv('report_exec_times_test.csv')
    
    print('Time, mean for test dataset:', dataframe_test["exec_time"].mean())
    
    # Normalize training feature - report_params
    eps=0.001
    dataframe['report_params'] = np.log(dataframe.pop('report_params')+eps)
    normed_df = dataframe
    
    # Normalize test feature - report_params
    eps=0.001
    dataframe_test['report_params'] = np.log(dataframe_test.pop('report_params')+eps)
    normed_df_test = dataframe_test
    
    # Data is automatically shuffled during split
    train, val = train_test_split(normed_df, test_size=0.2)
    print(len(train), 'train examples')
    print(len(val), 'validation examples')
    print(len(normed_df_test), 'test examples')
    
    return train, val, normed_df_test


# In[5]:


def build_feature_layer():
    feature_columns = []

    report_id = feature_column.categorical_column_with_vocabulary_list('report_id', [1, 2, 3, 4, 5])
    report_id_one_hot = feature_column.indicator_column(report_id)
    feature_columns.append(report_id_one_hot)

    feature_columns.append(feature_column.numeric_column('report_params'))

    day_part = feature_column.categorical_column_with_vocabulary_list('day_part', [1, 2, 3])
    day_part_one_hot = feature_column.indicator_column(day_part)
    feature_columns.append(day_part_one_hot)
    
    feature_layer = tf.keras.layers.DenseFeatures(feature_columns)
    
    return feature_layer


# In[6]:


# A utility method to create a tf.data dataset from a Pandas Dataframe
def df_to_dataset(dataframe, shuffle=True, batch_size=32):
    dataframe = dataframe.copy()
    labels = dataframe.pop('exec_time')
    ds = tf.data.Dataset.from_tensor_slices((dict(dataframe), labels))
    if shuffle:
        ds = ds.shuffle(buffer_size=len(dataframe))
    ds = ds.batch(batch_size)
    return ds


# In[7]:


# Build TensorFlow dataset
def build_dataset():
    train, val, normed_df_test = fetch_data()
    
    batch_size = 16
    train_ds = df_to_dataset(train, shuffle=False, batch_size=batch_size)
    val_ds = df_to_dataset(val, shuffle=False, batch_size=batch_size)
    test_ds = df_to_dataset(normed_df_test, shuffle=False, batch_size=batch_size)
    
    return train_ds, val_ds, test_ds


# In[8]:


# Construct neural network with Keras API on top of TensorFlow. RMSprop optimizer and mean squared error loss to check training quality
def build_model(feature_layer):
    model = tf.keras.Sequential([
        feature_layer,
        layers.Dense(16, activation='relu'),
        layers.Dense(8, activation='relu'),
        layers.Dense(1)
    ])

    optimizer = tf.keras.optimizers.RMSprop(0.001)

    model.compile(loss='mse',
                optimizer=optimizer,
                metrics=['mae', 'mse'])
    return model


# In[9]:


def train_model():
    best_history = None
    best_rmse = 1000
    
    train_ds, val_ds, test_ds = build_dataset()

    for i in range(10):
        print('Model training:', i+1)
        
        tf.keras.backend.clear_session()
        
        feature_layer = build_feature_layer()
        model = build_model(feature_layer)
        
        EPOCHS = 1000
        # The patience parameter is the amount of epochs to check for improvement
        early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=10)
        
        history = model.fit(train_ds,
                      validation_data=val_ds,
                      epochs=EPOCHS,
                      verbose=0,
                      callbacks=[early_stop])

        loss, mae, mse = model.evaluate(test_ds, verbose=0)

        rmse = math.sqrt(mse)
        print("Testing set RMSE Error:{:5.2f}".format(math.sqrt(mse)))
        if rmse < best_rmse:
            print("Saving model with RMSE Error:{:5.2f}".format(math.sqrt(mse)))
            model.save('./model_exec_time_temp/', save_format='tf')
            
            best_history = history
            best_rmse = rmse
            
    plot_history(best_history)
    print("Best RMSE Error:{:5.2f}".format(best_rmse))
    
    ts = calendar.timegm(time.gmtime())
    print('Creating new model:', ts)
    copyDirectory('./model_exec_time_temp/', './model_exec_time/' + str(ts))


# In[10]:


# train_model()


# In[14]:


def prepare_input_data(input_data):
    # Construct test data row with "unseen" feature values - report_id = 1, report_params = 15, day_part = 3 
    headers = ['report_id', 'report_params', 'day_part']
    dataframe_input = pd.DataFrame(input_data,
                                    columns=headers, 
                                    dtype=int,
                                    index=['input'])

    # Normalize report_params
    eps=0.001
    dataframe_input['report_params'] = np.log(dataframe_input.pop('report_params')+eps)
    dataframe_input_normed = dataframe_input
    
    input_ds = tf.data.Dataset.from_tensor_slices(dict(dataframe_input_normed))
    input_ds = input_ds.batch(1)

    for feature_batch in input_ds.take(1):
      for key, value in feature_batch.items():
        print("  {!r:20s}: {}".format(key, value))
        
    return input_ds


# In[39]:


# Prediction result for report execution time. This is correct, model learns the rule correct - more report params, means execution time will be less
def run_predict(input_data):
    input_ds = prepare_input_data(input_data)
    
    folders = get_immediate_subdirectories('./model_exec_time/')
    
    saved_model = tf.keras.models.load_model('./model_exec_time/' + max(folders))
    res = saved_model.predict(input_ds)
    
    return res


# In[40]:


# run_predict([[1, 15, 3]])


# In[25]:


# run_predict([[1, 15, 1]])

