import sys
import json
import matplotlib.pyplot as plt
import numpy as np

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

# Read the JSON string from command line arguments
input_json = sys.argv[1]

# Convert JSON string to Python dictionary
input_data = json.loads(input_json)
print(input_data)
# Extracting parameters
data = input_data['data']
plot_type = input_data['plot_type']
x_label = input_data['x_label']
y_label = input_data['y_label']
title = input_data['title']
file_name = input_data['file_name']
custom_code = input_data['custom_code']

# Apply custom data manipulation
data = manipulate_data(data, custom_code)

# Plotting
plt.figure()

if plot_type == "line":
    plt.plot(data)
elif plot_type == "bar":
    plt.bar(range(len(data)), data)
elif plot_type == "scatter":
    plt.scatter(range(len(data)), data)
else:
    print("Unsupported plot type")
    sys.exit(1)

plt.xlabel(x_label)
plt.ylabel(y_label)
plt.title(title)

# Save the plot as specified by the file_name parameter
plt.savefig(file_name)
print("Plot saved as", file_name)