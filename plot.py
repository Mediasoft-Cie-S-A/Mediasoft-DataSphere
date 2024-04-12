import sys
import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# Function to apply custom data manipulation
def manipulate_data(data, code):
    # Here you can add custom manipulation based on the provided code.
    # This is a basic example. Be cautious with exec for security reasons.
    # It's better to have predefined manipulation options identified by codes.
    try:
        exec(code)
    except Exception as e:
        print(e)
    return data
def plot_data(df, x_column, y_columns, plot_type='line', title='', xlabel='', ylabel='', save_path='plot.png', dpi=100):
    """
    Plots data from a pandas DataFrame.

    Parameters:
    - df: pandas.DataFrame containing the data.
    - x_column: string, name of the column to use for the x-axis.
    - y_columns: list of strings, names of the columns to plot on the y-axis.
    - plot_type: string, type of plot (e.g., 'line', 'bar', 'scatter').
    - title: string, title of the plot.
    - xlabel: string, label for the x-axis.
    - ylabel: string, label for the y-axis.
    - save_path: string, path where the plot image will be saved.
    - dpi: int, resolution of the output image.
    """
    plt.figure(figsize=(10, 5))
    
    for y_col in y_columns:
        if plot_type == 'line':
            plt.plot(df[x_column], df[y_col], label=y_col)
        elif plot_type == 'bar':
            plt.bar(df[x_column], df[y_col], label=y_col)
        elif plot_type == 'scatter':
            plt.scatter(df[x_column], df[y_col], label=y_col)
        else:
            raise ValueError("Unsupported plot type. Use 'line', 'bar', or 'scatter'.")
  
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.legend()
    plt.grid(True)
    plt.savefig(save_path, dpi=dpi)
    plt.close()

# Read the JSON string from command line arguments
input_json = sys.argv[1]

# Convert JSON string to Python dictionary
input_data = json.loads(input_json)
print(input_data)
# Extracting parameters
data = input_data['data']
columns = input_data['fields']
legend = input_data['legend']
plot_type = input_data['plot_type']
x_label = input_data['x_label']
y_label = input_data['y_label']
title = input_data['title']
file_name = input_data['file_name']
custom_code = input_data['custom_code']

# convert json data to pandas DataFrame
data = pd.DataFrame(data)
print (data.head())
# Apply custom data manipulation
data = manipulate_data(data, custom_code)

# plot data with the specified parameters
plot_data(data, x_column=legend, y_columns=columns, plot_type=plot_type, title=title, xlabel=x_label, ylabel=y_label, save_path=file_name)

