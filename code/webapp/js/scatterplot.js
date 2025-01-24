document.addEventListener("DOMContentLoaded", () => {
  const width = 700;
  const height = 500;
  const margin = { top: 20, right: 30, bottom: 50, left: 70 };

  // Create the SVG element
  const svg = d3
    .select("#scatterplot-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Define scales
  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // Add axes
  const xAxis = svg.append("g").attr("transform", `translate(0, ${height})`);
  const yAxis = svg.append("g");

  // Tooltip setup
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "5px 10px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0); // Start hidden

  const positionMapping = {
      attacking: ["FW", "F"], // Forwards/attacking
      midfield: ["MF"],       // Midfielders
      defensive: ["DF"],      // Defenders
      keeper: ["GK"],         // Goalkeepers
  };

  // Load data
  d3.json("data/2022-2023_Football_Player_Stats.json").then((data) => {
    const transformedData = data.map((d) => ({
      name: d.Player,
      attributes: d,
      isHighlighted: false, // Track whether the point is highlighted
    }));

    let selectedX = "PasTotCmp"; // Default X-axis
    let selectedY = "PasTotAtt"; // Default Y-axis

    const filters = {
      minAge: null,
      maxAge: null,
      leagues: ["Premier League", "La Liga", "Serie A", "Ligue 1", "Bundesliga"],
      searchTerm: "",
      positionCategory: "all",
    };

    function applyFilters(data) {
      return data.filter((d) => {
        const ageMatch =
          (!filters.minAge || +d.attributes.Age >= filters.minAge) &&
          (!filters.maxAge || +d.attributes.Age <= filters.maxAge);
        const leagueMatch = filters.leagues.includes(d.attributes.Comp);
        const positionMatch =
          filters.positionCategory === "all" ||
          positionMapping[filters.positionCategory]?.some((prefix) =>
            d.attributes.Pos.startsWith(prefix)
          );
        return ageMatch && leagueMatch && positionMatch;
      });
    }

    function updatePlot(data) {
      const filteredData = applyFilters(data);

      x.domain([0, d3.max(filteredData, (d) => +d.attributes[selectedX])]);
      y.domain([0, d3.max(filteredData, (d) => +d.attributes[selectedY])]);

      xAxis.call(d3.axisBottom(x));
      yAxis.call(d3.axisLeft(y));

      const circles = svg.selectAll("circle").data(filteredData, (d) => d.name);

      circles.exit().remove();

      circles
        .enter()
        .append("circle")
        .merge(circles)
        .attr("cx", (d) => x(+d.attributes[selectedX]))
        .attr("cy", (d) => y(+d.attributes[selectedY]))
        .attr("r", 5)
        .attr("fill", (d) => (d.isHighlighted ? "blue" : "#ff6347")) // Blue for highlighted points
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `<strong>${d.name}</strong><br>${selectedX}: ${+d.attributes[selectedX]}<br>${selectedY}: ${+d.attributes[selectedY]}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      // Bring highlighted points to the front
      svg.selectAll("circle")
        .filter((d) => d.isHighlighted)
        .raise(); // Bring highlighted points to the top
    }

    function highlightSearchMatches(searchValue) {
      transformedData.forEach((d) => {
        d.isHighlighted = searchValue
          ? d.name.toLowerCase().includes(searchValue.toLowerCase())
          : false;
      });

      // Re-render only the circle colors and raise highlighted points
      svg.selectAll("circle")
        .transition()
        .duration(200)
        .attr("fill", (d) => (d.isHighlighted ? "blue" : "#ff6347"))
        .end()
        .then(() => {
          svg.selectAll("circle")
            .filter((d) => d.isHighlighted)
            .raise(); // Ensure highlighted points are on top
        });
    }

    // Event listeners for filters
    d3.select("#x-axis-select").on("change", function () {
      selectedX = this.value;
      updatePlot(transformedData);
    });

    d3.select("#y-axis-select").on("change", function () {
      selectedY = this.value;
      updatePlot(transformedData);
    });

    d3.select("#min-age").on("input", function () {
      filters.minAge = +this.value || null;
      updatePlot(transformedData);
    });

    d3.select("#max-age").on("input", function () {
      filters.maxAge = +this.value || null;
      updatePlot(transformedData);
    });

    d3.select("#player-search").on("input", function () {
      const searchValue = this.value.trim();
      highlightSearchMatches(searchValue); // Highlight matching players
    });

    d3.selectAll("#position-filter button").on("click", function () {
      filters.positionCategory = d3.select(this).attr("data-position");
      updatePlot(transformedData);
    });

    d3.selectAll("#league-filter input[type=checkbox]").on("change", function () {
      const selectedLeagues = Array.from(
        d3.selectAll("#league-filter input[type=checkbox]:checked").nodes()
      ).map((input) => input.value);
      filters.leagues = selectedLeagues;
      updatePlot(transformedData);
    });

    updatePlot(transformedData);
  });
}).catch(error => {
  console.error("Error loading JSON:", error);
});
