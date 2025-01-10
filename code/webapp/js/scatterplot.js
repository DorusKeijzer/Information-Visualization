// Set up chart dimensions
const width = 700;
const height = 500;
const margin = { top: 20, right: 30, bottom: 50, left: 70 };

// Create the SVG element
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add a blue background to the scatterplot
svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "#2c6a9b"); // Light blue background

// Define scales
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Add axes
const xAxis = svg.append("g").attr("transform", `translate(0, ${height})`);
const yAxis = svg.append("g");

// Add labels
svg.append("text")
  .attr("x", width / 2)
  .attr("y", height + 40)
  .style("text-anchor", "middle")
  .style("fill", "white")
  .text("Completed Passes");

svg.append("text")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 15)
  .attr("transform", "rotate(-90)")
  .style("text-anchor", "middle")
  .style("fill", "white")
  .text("Number of Passes");

// Tooltip setup
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "white")
  .style("padding", "5px 10px")
  .style("border-radius", "5px")
  .style("pointer-events", "none")
  .style("opacity", 0); // Start hidden

// Load data from JSON
d3.json("../webapp/data/2022-2023_Football_Player_Stats.json").then(data => {
  // Transform data
  const transformedData = data.map(d => ({
    name: d.Player,
    x: +d.PasTotCmp, // Completed Passes
    y: +d.PasTotAtt, // Number of Passes
    totalPassValue: +d.Rk, // Sum of PasTotCmp and PasTotAtt
    category: d.Pos.startsWith("DF")
      ? "defensive"
      : d.Pos.startsWith("MF")
      ? "midfield"
      : "attacking",
    age: +d.Age,
    isHighlighted: false // Track if the player is highlighted
  }));

  // Filter top 500 players by the sum of PasTotCmp and PasTotAtt
  const topPlayers = transformedData
    .sort((a, b) => b.totalPassValue - a.totalPassValue)
    .slice(0, 500);

  // Keep track of the current dataset (filtered or not)
  let currentDataset = topPlayers;

  // Function to update the plot
  function updatePlot(filteredData) {
    // Update scales' domains
    x.domain([0, d3.max(filteredData, d => d.x)]);
    y.domain([0, d3.max(filteredData, d => d.y)]);

    // Update axes
    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y));

    // Bind data for circles
    const circles = svg.selectAll("circle").data(filteredData, d => d.name);

    // Remove old points
    circles.exit().remove();

    // Add and update points
    circles
      .enter()
      .append("circle")
      .merge(circles)
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 5) // Smaller circle radius
      .attr("fill", d => (d.isHighlighted ? "blue" : "red")) // Highlight matches in blue
      .attr("stroke", "white") // White outline
      .attr("stroke-width", 1.5) // Outline thickness
      .attr("class", d => `player-circle ${d.category}`)
      .on("mouseover", function (event, d) {
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.name}</strong>`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Bring highlighted circles to the front
    svg.selectAll("circle").filter(d => d.isHighlighted).raise();
  }

  // Initial plot with all data
  updatePlot(topPlayers);

  // Filtering logic
  document.getElementById("show-all").addEventListener("click", () => {
    topPlayers.forEach(d => (d.isHighlighted = false)); // Reset highlights
    currentDataset = topPlayers;
    updatePlot(topPlayers);
  });

  document.getElementById("attacking").addEventListener("click", () => {
    topPlayers.forEach(d => (d.isHighlighted = false)); // Reset highlights
    currentDataset = topPlayers.filter(d => d.category === "attacking");
    updatePlot(currentDataset);
  });

  document.getElementById("midfield").addEventListener("click", () => {
    topPlayers.forEach(d => (d.isHighlighted = false)); // Reset highlights
    currentDataset = topPlayers.filter(d => d.category === "midfield");
    updatePlot(currentDataset);
  });

  document.getElementById("defensive").addEventListener("click", () => {
    topPlayers.forEach(d => (d.isHighlighted = false)); // Reset highlights
    currentDataset = topPlayers.filter(d => d.category === "defensive");
    updatePlot(currentDataset);
  });

  // Search functionality
  d3.select("#player-search").on("input", function () {
    const searchValue = this.value.toLowerCase();

    // Highlight players matching the search or reset if search is empty
    currentDataset.forEach(d => {
      d.isHighlighted = searchValue ? d.name.toLowerCase().includes(searchValue) : false;
    });

    updatePlot(currentDataset);
  });
}).catch(error => {
  console.error("Error loading JSON:", error);
});
