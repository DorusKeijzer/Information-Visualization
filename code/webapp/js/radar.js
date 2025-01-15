/************************
 *  Constants & Config
 ************************/
const radarWidth = 900;
const radarHeight = 750;
const radarMargin = { top: 50, right: 50, bottom: 50, left: 50 };

/************************
 *  Data
 ************************/

const radarData = [
  {
    name: "Player A",
    axes: [
      { axis: "Shooting", value: 0.8 },
      { axis: "Passing", value: 0.6 },
      { axis: "Dribbling", value: 0.7 },
      { axis: "Defending", value: 0.4 },
      { axis: "Physical", value: 0.9 },
    ],
    team_selection: true,
  },
  {
    name: "Player B",
    axes: [
      { axis: "Shooting", value: 0.5 },
      { axis: "Passing", value: 0.7 },
      { axis: "Dribbling", value: 0.8 },
      { axis: "Defending", value: 0.6 },
      { axis: "Physical", value: 0.6 },
    ],
    team_selection: true,
  },
  {
    name: "Player C",
    axes: [
      { axis: "Shooting", value: 0.9 },
      { axis: "Passing", value: 0.3 },
      { axis: "Dribbling", value: 0.4 },
      { axis: "Defending", value: 0.6 },
      { axis: "Physical", value: 0.4 },
    ],
    team_selection: true,
  },
  {
    name: "Player D",
    axes: [
      { axis: "Shooting", value: 0.7 },
      { axis: "Passing", value: 0.8 },
      { axis: "Dribbling", value: 0.6 },
      { axis: "Defending", value: 0.5 },
      { axis: "Physical", value: 0.7 },
    ],
    team_selection: true,
  },
  {
    name: "Player E",
    axes: [
      { axis: "Shooting", value: 0.6 },
      { axis: "Passing", value: 0.7 },
      { axis: "Dribbling", value: 0.9 },
      { axis: "Defending", value: 0.4 },
      { axis: "Physical", value: 0.5 },
    ],
    team_selection: true,
  },
  {
    name: "Player F",
    axes: [
      { axis: "Shooting", value: 0.4 },
      { axis: "Passing", value: 0.6 },
      { axis: "Dribbling", value: 0.5 },
      { axis: "Defending", value: 0.7 },
      { axis: "Physical", value: 0.8 },
    ],
    team_selection: true,
  },
  {
    name: "Player G",
    axes: [
      { axis: "Shooting", value: 0.8 },
      { axis: "Passing", value: 0.5 },
      { axis: "Dribbling", value: 0.6 },
      { axis: "Defending", value: 0.7 },
      { axis: "Physical", value: 0.9 },
    ],
    team_selection: true,
  },
  {
    name: "Player H",
    axes: [
      { axis: "Shooting", value: 0.7 },
      { axis: "Passing", value: 0.6 },
      { axis: "Dribbling", value: 0.7 },
      { axis: "Defending", value: 0.6 },
      { axis: "Physical", value: 0.7 },
    ],
    team_selection: true,
  },
  {
    name: "Player I",
    axes: [
      { axis: "Shooting", value: 0.9 },
      { axis: "Passing", value: 0.8 },
      { axis: "Dribbling", value: 0.7 },
      { axis: "Defending", value: 0.5 },
      { axis: "Physical", value: 0.6 },
    ],
    team_selection: false,
  },
  {
    name: "Player J",
    axes: [
      { axis: "Shooting", value: 0.6 },
      { axis: "Passing", value: 0.7 },
      { axis: "Dribbling", value: 0.8 },
      { axis: "Defending", value: 0.6 },
      { axis: "Physical", value: 0.8 },
    ],
    team_selection: true,
  },
];


const team = radarData.filter(player => player.team_selection);
const non_team = radarData.filter(player => !player.team_selection);

/************************
 *  Setup & Calculations
 ************************/
// Calculate radius and angle
const radarRadius = Math.min(radarWidth, radarHeight) / 2 - radarMargin.top;
const radarAngleSlice = (Math.PI * 2) / radarData[0].axes.length;

// Create SVG
const radarSvg = d3
  .select("#radar")
  .append("svg")
  .attr("width", radarWidth)
  .attr("height", radarHeight)
  .append("g")
  .attr("transform", `translate(${radarWidth / 2}, ${radarHeight / 2})`);

// Define radial scale
const radarScale = d3.scaleLinear().range([0, radarRadius]).domain([0, 1]);

/************************
 *  Grid Functions
 ************************/
function draw_grid_area(levels) {
  radarSvg
    .selectAll(".grid-circle")
    .data(d3.range(1, levels + 1).reverse())
    .enter()
    .append("circle")
    .attr("r", d => (radarRadius / levels) * d)
    .attr("class", "grid-circle")
    .style("fill", "#2c6a9b")
    .style("fill-opacity", 1.0);
}

function draw_grid_lines(levels) {
  radarSvg
    .selectAll(".grid-circle")
    .data(d3.range(1, levels + 1).reverse())
    .enter()
    .append("circle")
    .attr("r", d => (radarRadius / levels) * d)
    .attr("class", "grid-circle")
    .style("stroke", "white")
    .style("fill-opacity", 0.0);
}

function draw_grid_labels() {
  radarSvg
    .selectAll(".grid-label")
    .data(d3.range(1, radarGridLevels + 1).reverse())
    .enter()
    .append("text")
    .attr("x", 0)
    .attr("y", d => -radarScale(d / radarGridLevels))
    .attr("class", "grid-label")
    .attr("dy", "-0.3em")
    .style("fill", "white")
    .style("text-anchor", "middle")
    .text(d => `${(d / radarGridLevels) * 100}%`);
}

/************************
 *  Axes Functions
 ************************/
function draw_axes() {
  const radarAxes = radarSvg
    .selectAll(".axis")
    .data(radarData[0].axes)
    .enter()
    .append("g")
    .attr("class", "axis");

  radarAxes
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (_, i) => radarScale(1) * Math.cos(radarAngleSlice * i - Math.PI / 2))
    .attr("y2", (_, i) => radarScale(1) * Math.sin(radarAngleSlice * i - Math.PI / 2))
    .style("stroke", "white")
    .style("stroke-width", 1.5);

  radarAxes
    .append("text")
    .attr("x", (_, i) => radarScale(1.1) * Math.cos(radarAngleSlice * i - Math.PI / 2))
    .attr("y", (_, i) => radarScale(1.1) * Math.sin(radarAngleSlice * i - Math.PI / 2))
    .style("fill", "white")
    .style("text-anchor", "middle")
    .text(d => d.axis);
}

/************************
 *  Polygon Drawing Setup
 ************************/
// Draw radar polygons using polar coordinates
const radarLine = d3
  .lineRadial()
  .radius(d => radarScale(d.value))
  .angle((_, i) => i * radarAngleSlice)
  .curve(d3.curveLinearClosed);

// Convert polar coordinates to cartesian coordinates
function polar2Cartesian(r, theta) {
  return [Math.sin(theta) * r, -Math.cos(theta) * r];
}

function player2Points(player) {
  const points = player.axes.map((d, i) => {
    const r = radarScale(d.value);
    const theta = i * radarAngleSlice;
    return polar2Cartesian(r, theta);
  });
  points.push(points[0]); // Close the polygon
  return points;
}

/************************
 *  Polygon Generation
 ************************/
const playerPolygons = team.map(player => {
  return turf.polygon([player2Points(player)]);
});

// Compute the union of all player polygons using Turf.js
let unionPolygon = turf.union(turf.featureCollection(playerPolygons));

// Create a line generator for D3
const lineGenerator = d3.line()
  .x(d => d[0])
  .y(d => d[1]);

/************************
 *  Drawing Functions
 ************************/
function draw_union(unionPolygon) {
  const coordinates = unionPolygon.geometry.coordinates[0];
  radarSvg
    .append("path")
    .datum(coordinates)
    .attr("d", lineGenerator)
    .attr("class", "team-hull")
    .style("fill", "red")
    .style("fill-opacity", 0.4)
    .style("stroke", "red")
    .style("stroke-opacity", 0.4)
    .style("stroke-width", 4);
}

function draw_individual(set_of_players, color) {
  radarSvg
    .selectAll(".radar-area")
    .data(set_of_players)
    .enter()
    .append("path")
    .attr("class", "radar-area")
    .attr("d", d => radarLine(d.axes))
    .style("fill", color)
    .style("fill-opacity", 0.3)
    .style("stroke", color)
    .style("stroke-width", 4);
}

/************************
 *  Initialization
 ************************/
draw_grid_lines(5);
draw_axes();

if (unionPolygon) {
  draw_union(unionPolygon);
}
draw_individual(non_team, "blue");
draw_grid_labels();

/************************
 *  Interactivity
 ************************/
// Add tooltips
radarSvg
  .selectAll(".radar-area")
  .on("mouseover", function(event, d) {
    d3.select(this)
      .style("fill-opacity", 0.6)
      .style("cursor", "pointer");
    
    radarSvg
      .append("text")
      .attr("class", "tooltip")
      .attr("x", 0)
      .attr("y", -radarRadius - 10)
      .style("text-anchor", "middle")
      .style("fill", "white")
      .text(d.name);
  })
  .on("mouseout", function() {
    d3.select(this)
      .style("fill-opacity", 0.3)
      .style("cursor", "default");
    
    radarSvg.selectAll(".tooltip").remove();
  });

