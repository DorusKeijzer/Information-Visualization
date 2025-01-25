import { DataManager } from './datamanager.js';

class RadarGraph {
    constructor(selector, columns) {
        this.columns = columns;
        this.radarWidth = 900;
        this.radarHeight = 750;
        this.radarMargin = { top: 50, right: 50, bottom: 50, left: 50 };
        this.radarRadius = Math.min(this.radarWidth, this.radarHeight) / 2 - this.radarMargin.top;
        this.radarAngleSlice = (Math.PI * 2) / columns.length;
        
        // Create SVG
        this.svg = d3.select("#radar")
            .append("svg")
            .attr("width", this.radarWidth)
            .attr("height", this.radarHeight)
            .append("g")
            .attr("transform", `translate(${this.radarWidth / 2}, ${this.radarHeight / 2})`);
        
        // Define radial scale
        this.radarScale = d3.scaleLinear().range([0, this.radarRadius]).domain([0, 1]);
        
        // Line generator for radar polygons
        this.radarLine = d3.lineRadial()
            .radius(d => this.radarScale(d.value))
            .angle((_, i) => i * this.radarAngleSlice)
            .curve(d3.curveLinearClosed);
    }

    // Prepare radar data
    prepareRadarData(data, columns) {
        return data.map(player => ({
            name: player.Player,
            axes: columns.map(col => ({
                axis: col,
                value: +player[col] / Math.max(...data.map(d => +d[col] || 0))
            })),
            team_selection: true
        }));
    }

    // Draw grid lines
    drawGridLines(levels) {
        this.svg
            .selectAll(".grid-circle")
            .data(d3.range(1, levels + 1).reverse())
            .enter()
            .append("circle")
            .attr("r", d => (this.radarRadius / levels) * d)
            .attr("class", "grid-circle")
            .style("stroke", "white")
            .style("fill-opacity", 0.0);
    }

    // Draw axes
    drawAxes() {
        const radarAxes = this.svg
            .selectAll(".axis")
            .data(this.columns.map(col => ({ axis: col })))
            .enter()
            .append("g")
            .attr("class", "axis");

        radarAxes
            .append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (_, i) => this.radarScale(1) * Math.cos(this.radarAngleSlice * i - Math.PI / 2))
            .attr("y2", (_, i) => this.radarScale(1) * Math.sin(this.radarAngleSlice * i - Math.PI / 2))
            .style("stroke", "white")
            .style("stroke-width", 1.5);

        radarAxes
            .append("text")
            .attr("x", (_, i) => this.radarScale(1.1) * Math.cos(this.radarAngleSlice * i - Math.PI / 2))
            .attr("y", (_, i) => this.radarScale(1.1) * Math.sin(this.radarAngleSlice * i - Math.PI / 2))
            .style("fill", "white")
            .style("text-anchor", "middle")
            .text(d => d.axis);
    }

    // Draw grid labels
    drawGridLabels(levels) {
        this.svg
            .selectAll(".grid-label")
            .data(d3.range(1, levels + 1).reverse())
            .enter()
            .append("text")
            .attr("x", 0)
            .attr("y", d => -this.radarScale(d / levels))
            .attr("class", "grid-label")
            .attr("dy", "-0.3em")
            .style("fill", "white")
            .style("text-anchor", "middle")
            .text(d => `${(d / levels) * 100}%`);
    }

    // Draw individual player polygons
    drawPlayerPolygons(data, color = "blue") {
        this.svg
            .selectAll(".radar-area")
            .data(data)
            .enter()
            .append("path")
            .attr("class", "radar-area")
            .attr("d", d => this.radarLine(d.axes))
            .style("fill", color)
            .style("fill-opacity", 0.3)
            .style("stroke", color)
            .style("stroke-width", 4);
    }

    // Initialize and render the radar graph
    render(data) {
        // Clear previous content
        this.svg.selectAll("*").remove();

        // Draw grid and axes
        this.drawGridLines(5);
        this.drawAxes();
        this.drawGridLabels(5);

        // Draw player polygons
        this.drawPlayerPolygons(data);
    }
}

// Initialize RadarGraph
function initRadarGraph() {
    const radarColumns = ['Goals', 'Assists', 'PasTotCmp%', 'SoT', 'MP'];
    const radarGraph = new RadarGraph("#radar", radarColumns);

    DataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
        Age: value => +value,
        MP: value => +value,
        Goals: value => +value,
        SoT: value => +value,
        'PasTotCmp%': value => +value,
        Assists: value => +value
    }).then(() => {
        // Register a listener to update the radar graph when data is loaded
        DataManager.registerListener((data) => {
            // Prepare radar data from filtered data
            const radarData = radarGraph.prepareRadarData(data, radarColumns);
            
            // Render the graph
            radarGraph.render(radarData);
        });
    }).catch(error => {
        console.error("Error loading data:", error);
    });
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initRadarGraph);

export { RadarGraph };
