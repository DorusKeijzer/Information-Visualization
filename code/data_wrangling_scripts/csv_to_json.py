import csv
import json
import os
import chardet

# Path to the CSV file
csv_file_path = "../webapp/data/2022-2023 Football Player Stats.csv"

# JSON output file
json_file_path = "../webapp/data/2022-2023_Football_Player_Stats.json"

def detect_encoding(file_path):
    """Detect the encoding of a file."""
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read())
        return result['encoding']

# Function to convert CSV to JSON
def csv_to_json_file(csv_file_path, json_file_path, delimiter=";"):
    """
    Convert a CSV file to JSON and save it to a file.

    :param csv_file_path: Path to the CSV file
    :param json_file_path: Path to save the JSON file
    :param delimiter: Delimiter used in the CSV file
    """
    if not os.path.exists(csv_file_path):
        print(f"Error: The file '{csv_file_path}' does not exist.")
        return

    try:
        # Detect the file encoding
        encoding = detect_encoding(csv_file_path)
        print(f"Detected encoding: {encoding}")

        # Read the CSV file with the detected encoding
        with open(csv_file_path, mode='r', encoding=encoding) as csv_file:
            csv_reader = csv.DictReader(csv_file, delimiter=delimiter)
            
            # Convert rows to a list of dictionaries
            data = [row for row in csv_reader]

        # Write to JSON file
        with open(json_file_path, mode='w', encoding='utf-8') as json_file:
            json.dump(data, json_file, indent=4, ensure_ascii=False)
        
        print(f"JSON file has been created at: {json_file_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

# Run the function
csv_to_json_file(csv_file_path, json_file_path)