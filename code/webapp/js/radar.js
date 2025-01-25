


import { DataManager } from './datamanager.js';

class RadarGraph {
  constructor(selector, columns) {
    console.log("RadarGraph constructor called");
    this.columns = columns;
    this.radarWidth = 600;
    this.radarHeight = 600;
    this.radarMargin = { top: 50, right: 50, bottom: 50, left: 50 };
    this.radarRadius = Math.min(this.radarWidth, this.radarHeight) / 2 - this.radarMargin.top;
    this.radarAngleSlice = (Math.PI * 2) / columns.length;

    this.selector = selector;

    // Create SVG
    console.log("Creating SVG element in selector:", selector);
    this.svg = d3.select(selector)
      .append("svg")
      .attr("width", this.radarWidth)
      .attr("height", this.radarHeight)
      .append("g")
      .attr("transform", `translate(${this.radarWidth / 2}, ${this.radarHeight / 2})`);
    console.log("SVG element created:", this.svg);

    // Define radial scale
    console.log("Defining radial scale with range [0, radarRadius]:", this.radarRadius);
    this.radarScale = d3.scaleLinear().range([0, this.radarRadius]).domain([0, 1]);

    // Line generator for radar polygons
    console.log("Defining line generator for radar polygons");
    this.radarLine = d3.lineRadial()
      .radius(d => this.radarScale(d.value))
      .angle((_, i) => i * this.radarAngleSlice)
      .curve(d3.curveLinearClosed);
  }

  prepareRadarData(data, columns) {
    console.log("Preparing radar data with columns:", columns);
    console.log("Sample data:", data[0]);
    console.log("Total data points:", data.length);

    return data.map(player => {
      const axes = columns.map(col => {
        const value = +player[col];
        const maxValue = Math.max(...data.map(d => +d[col] || 0));
        console.log(`Column: ${col}, Value: ${value}, Max Value: ${maxValue}`);
        return {
          axis: col,
          value: maxValue ? value / maxValue : 0
        };
      });

      console.log("Prepared axes for player:", player.Player, axes);
      return {
        name: player.Player,
        axes: axes,
        team_selection: true
      };
    });
  }

  render(data) {
    try {
      console.log("Rendering radar graph");
      console.log("Rendering in selector:", this.selector);
      console.log("Data to render:", data);

      // Verify the container exists
      const container = d3.select(this.selector);
      console.log("Container exists:", !container.empty());

      // Clear previous content
      container.selectAll("svg").remove();

      // Recreate SVG
      this.svg = container
        .append("svg")
        .attr("width", this.radarWidth)
        .attr("height", this.radarHeight)
        .append("g")
        .attr("transform", `translate(${this.radarWidth / 2}, ${this.radarHeight / 2})`);
      console.log("SVG recreated:", this.svg);

      // Draw grid
      const gridData = d3.range(1, 6).reverse();
      console.log("Drawing grid with data:", gridData);
      this.svg.selectAll(".grid-circle")
        .data(gridData)
        .enter()
        .append("circle")
        .attr("r", d => (this.radarRadius / 5) * d)
        .style("fill", "none")
        .style("stroke", "white")
        .style("stroke-opacity", 0.5);

      // Draw axes
      console.log("Drawing axes for columns:", this.columns);
      const axesGroup = this.svg.selectAll(".axis")
        .data(this.columns)
        .enter()
        .append("g")
        .attr("class", "axis");

      axesGroup.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => this.radarScale(1) * Math.cos(this.radarAngleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => this.radarScale(1) * Math.sin(this.radarAngleSlice * i - Math.PI / 2))
        .style("stroke", "white");

      axesGroup.append("text")
        .attr("x", (d, i) => this.radarScale(1.1) * Math.cos(this.radarAngleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => this.radarScale(1.1) * Math.sin(this.radarAngleSlice * i - Math.PI / 2))
        .style("fill", "white")
        .style("text-anchor", "middle")
        .text(d => d);

      // Draw player polygons
      console.log("Drawing radar polygons for first 5 players");
      this.svg.selectAll(".radar-area")
        .data(data.slice(0, 5)) // Limit to first 5 players
        .enter()
        .append("path")
        .attr("class", "radar-area")
        .attr("d", d => {
          const path = this.radarLine(d.axes);
          console.log("Generated path for player:", d.name, path);
          return path;
        })
        .style("fill", (d, i) => d3.schemeCategory10[i])
        .style("fill-opacity", 0.3)
        .style("stroke", (d, i) => d3.schemeCategory10[i])
        .style("stroke-width", 2);
    }
    catch (error) {
      console.error("Rendering error:", error);
    }
  }
}



function initRadarGraph() {
  console.log("Initializing Radar Graph");
  const radarColumns = ['Goals', 'Assists', 'PasTotCmp%', 'SoT', 'MP'];
  console.log("Radar container exists:", document.querySelector("#radar") !== null);

  const radarGraph = new RadarGraph("#radar", radarColumns);

  DataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
    Age: value => +value,
    MP: value => +value,
    Goals: value => +value,
    SoT: value => +value,
    'PasTotCmp%': value => +value,
    Assists: value => +value
  }).then(() => {
    console.log("Data loaded, registering listener");
    DataManager.registerListener((data) => {
      console.log("Listener triggered with data length:", data.length);
      const radarData = radarGraph.prepareRadarData(data, radarColumns);
      console.log("Prepared radar data:", radarData);

      radarGraph.render(radarData);
    });
  }).catch(error => {
    console.error("Error loading data:", error);
  });
}

document.addEventListener('DOMContentLoaded', initRadarGraph);

export { RadarGraph };

