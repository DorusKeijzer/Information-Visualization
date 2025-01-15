// Radar chart dimensions
const radarWidth = 700;
const radarHeight = 500;
const radarMargin = { top: 50, right: 50, bottom: 50, left: 50 };

// Data for radar chart
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
    team_selection: true,  // Indicates this player is part of the currently selected team
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
    team_selection: false,
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
];


team = radarData.filter(d => d.team_selection)

non_team = radarData.filter(d => !d.team_selection)


console.log("Team", team)
console.log("Non Team", non_team)



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
  .attr(
    "transform",
    `translate(${radarWidth / 2}, ${radarHeight / 2})`
  );

// Define radial scale
const radarScale = d3.scaleLinear().range([0, radarRadius]).domain([0, 1]);

// Draw grid circles
const radarGridLevels = 5;
const radarGridLines = radarSvg
  .selectAll(".grid-circle")
  .data(d3.range(1, radarGridLevels + 1).reverse())
  .enter()
  .append("circle")
  .attr("r", d => (radarRadius / radarGridLevels) * d)
  .attr("class", "grid-circle")
  .style("fill", "#2c6a9b")
  .style("stroke", "white")
  .style("fill-opacity", 0.1);

// Draw grid labels
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

// Draw axes
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
  .attr("x", (_, i) => (radarScale(1.1) * Math.cos(radarAngleSlice * i - Math.PI / 2)))
  .attr("y", (_, i) => (radarScale(1.1) * Math.sin(radarAngleSlice * i - Math.PI / 2)))
  .style("fill", "white")
  .style("text-anchor", "middle")
  .text(d => d.axis);

// Draw radar polygons using polar coordinates cause that is easier to work with
const radarLine = d3
  .lineRadial()
  .radius(d => radarScale(d.value))
  .angle((_, i) => i * radarAngleSlice);

// converts polar coordinates to cartesian coordinates cause that is required for D3's polygon hull function
function polar2Cartesian(r, theta){ 
  return [Math.sin(theta) * r, -Math.cos(theta) * r];
};

// gets the cartesian coordinates of a player
function player2Points(player) { 
  return player.axes.map((d, i) => {
  const r = radarScale(d.value);
  const theta = i * radarAngleSlice;
  return polar2Cartesian(r, theta);
});

}

team_hull = []

// adds player of the users team to the outer hull 
team.forEach(player => {
  player_points = player2Points(player)
  team_hull = team_hull.concat(player2Points(player));
});

team_hull_polygon = d3.polygonHull(team_hull)


const lineGenerator = d3.line()
  .x(d => d[0])  // x-coordinate of the point
  .y(d => d[1]); // y-coordinate of the point

// Draw the team hull (convex polygon)
radarSvg
  .append("path")
  .datum(team_hull_polygon)  // Set the convex hull points as the data
  .attr("d", lineGenerator)  // Generate the path using the line generator
  .attr("class", "team-hull")  // Add a class for styling
  .style("fill", "orange")  // Color of the hull
  .style("fill-opacity", 0.3)  // Transparency
  .style("stroke", "orange")  // Stroke color
  .style("stroke-width", 2);  // Stroke width

team_hull.forEach(d =>{
  radarSvg
    .append("circle")
    .attr('cx', d[0])
    .attr('cy', d[1])
    .attr("r",4)
    .style("fill", "orange")
    .style("stroke", "black")
    .style("stroke-width", 1)

});

team.forEach(player => {
  radarSvg
    .append("path")
    .datum(player.axes)
    .attr("class", "radar-area")
    .attr("d", radarLine)
    .style("fill", player => player.team_selection ? "orange" : "blue")
    .style("fill-opacity", 0.3)
    .style("stroke",  player => player.team_selection ? "orange" : "blue")
    .style("stroke-width", 2);
});

// Add tooltips for each area
radarSvg
  .selectAll(".radar-area")
  .on("mouseover", function (_, _) {
    d3.select(this).style("fill-opacity", 0.6);
  })
  .on("mouseout", function (_, _) {
    d3.select(this).style("fill-opacity", 0.3);
  });

