# 📊 Information Visualization Web App

This project is an **interactive data visualization web application** that allows users to analyze **football player statistics** from the **2022-2023 season**. The application provides **scatter plots, radar charts, and heatmaps** to explore various performance metrics.

## 📁 Project Structure

```
INFORMATION-VISUALIZATION
│── code/
│   ├── data_wrangling_scripts/
│   │   ├── .gitkeep
│   │   ├── csv_to_json.py       # Python script to convert CSV data into JSON format
│   │
│   ├── webapp/
│   │   ├── css/
│   │   │   ├── styles.css       # Styling for all visualizations
│   │   │
│   │   ├── data/
│   │   │   ├── .gitkeep
│   │   │   ├── 2022-2023_Football_Player_Stats.json  # Player statistics in JSON format
│   │   │
│   │   ├── js/
│   │   │   ├── datamanager.js   # Handles loading and filtering data
│   │   │   ├── heatmap.js       # Generates a heatmap visualization
│   │   │   ├── main.js          # Initializes the application
│   │   │   ├── radar.js         # Generates a radar chart visualization
│   │   │   ├── scatterplot.js   # Generates a scatter plot visualization
│   │   │
│   │   ├── heatmap.html         # Page for heatmap visualization
│   │   ├── index.html           # Homepage (Main Dashboard)
│   │   ├── radar.html           # Page for radar chart visualization
│   │   ├── scatterplot.html     # Page for scatter plot visualization
```
---

## 🚀 Features
✅ **Scatter Plot Visualization** (`scatterplot.js`)  
✔ Allows users to compare **two selected metrics** on a **scatter plot**.  
✔ Players can be **highlighted and persist in the plot**, even when filtered out.  
✔ Interactive **tooltip** for player details.  

✅ **Radar Chart Visualization** (`radar.js`)  
✔ Enables users to **compare multiple players' metrics** on a **radar chart**.  
✔ Players are grouped and **compared based on their position-specific attributes** (e.g., attacking, midfield, defensive).  
✔ Users can **sort players dynamically** by clicking on any metric in the radar legend. 

✅ **Heatmap Visualization** (`heatmap.js`)  
✔ Provides an **overview of player performance metrics** using a **color-coded heatmap**.  
✔ Players can be **locked** to stabilise those items for further comparisons and other views.  
✔ Interactive **tooltip** similar to the one is the scatterplot.  

✅ **Data Management** (`datamanager.js`)  
✔ Loads player statistics from a JSON file.  
✔ Applies **filters** (age, league, minutes played, etc.).
✔ Stores **selected players** across visualizations.

✅ **Custom Filters** (`main.js`)  
✔ Users can apply **filters** to adjust the displayed data dynamically.  

---

## 🔧 Setup & Installation
```bash
1️⃣ Clone the Repository

git clone https://github.com/your-username/information-visualization.git
cd information-visualization/webapp

2️⃣ Install Dependencies

This project uses D3.js for visualizations. If you don’t have it, you can include it in your project:

npm install d3

Or use a CDN link in your HTML files:

<script src="https://d3js.org/d3.v7.min.js"></script>

3️⃣ Run a Local Server

Since the project loads JSON data via fetch(), you need to run a local server:

python3 -m http.server 8000

or with Node.js:

npm install -g http-server
http-server .

Then, open http://localhost:8000/webapp/index.html in your browser.


🖥️ How to Use the Web App

1️⃣ Open the Web App

	•	Navigate to index.html in your browser (http://localhost:8000/webapp/index.html).
	•	There is a main menu which points towards the two main visualizations.

2️⃣ Interact with the Scatter Plot

	•	Use the X-axis and Y-axis dropdowns to choose different metrics.
    •	Use any of the many offered filters to change the plot or zoom in.
	•	Click on a data point to select a player (selected players stay visible even when filtered out).
	•	Hover over a data point to see the player’s stats.

3️⃣ Interact with the Heatmap

	•	Adjust Age, Minutes Played, Position, and League filters to refine the dataset.
	•	Click on a column header to sort the players dynamically by that statistic.
	•	Lock specific players using the “Lock” button to retain them in other visualizations.

4️⃣ Switch to the Radar view
	•	Click on the “Radar Chart” button in the heatmap or scatter plot to navigate to radar.html.
	•	Compare selected players based on their position attributes (Striker, Midfielder, Defender).
	•	Click on any statistic name in the radar legend to sort players dynamically based on that metric.


📌 Dependencies

	•	D3.js – For data visualization
	•	Bootstrap (Optional) – For UI styling