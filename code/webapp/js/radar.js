const width = 500;
const height = 500;
const margin = 50;

console.log("radar.js connected")

const radius = Math.min(width, height) / 2 - margin;

const data = [
  { axis: "Metric A", value: 0.8 },
  { axis: "Metric B", value: 0.6 },
  { axis: "Metric C", value: 0.9 },
  { axis: "Metric D", value: 0.7 },
  { axis: "Metric E", value: 0.5 },
];

const svg = d3
  .select("#radar")
  .append("svg")
  .attr("width", width)
  .attr("height", height)


console.log(radius)

