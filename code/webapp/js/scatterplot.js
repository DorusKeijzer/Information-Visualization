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
    attacking: ["FW", "F"],
    midfield: ["MF"],
    defensive: ["DF"],
    keeper: ["GK"],
  };

  const playerList = d3.select("#player-list"); // Reference to the player list container

  // Load data
  d3.json("data/2022-2023_Football_Player_Stats.json").then((data) => {
    const transformedData = data.map((d) => ({
      name: d.Player,
      attributes: d,
      isHighlighted: false, // Track whether the point is highlighted
      isSearchHighlighted: false, // Track whether the point matches the search
    }));

    let selectedX = "PasTotCmp";
    let selectedY = "PasTotAtt";

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
        .attr("fill", (d) =>
          d.isHighlighted
            ? "blue"
            : d.isSearchHighlighted
            ? "green"
            : "#ff6347"
        ) // Blue for selected, green for search matches, default orange
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
        .on("mouseout", () => tooltip.style("opacity", 0))
        .on("click", function (event, d) {
          // Toggle the isHighlighted property for the clicked player
          d.isHighlighted = !d.isHighlighted;

          // Update the color of the clicked circle
          d3.select(this).attr("fill", d.isHighlighted ? "blue" : "#ff6347");

          // Update the selected players list
          const highlightedPlayers = transformedData.filter((p) => p.isHighlighted);
          updateSelectedPlayersList(highlightedPlayers);
        });

      // Bring search-highlighted points to the top
      svg.selectAll("circle")
        .filter((d) => d.isSearchHighlighted)
        .raise(); // Ensure search-highlighted points are on top

      // Bring highlighted points to the front
      svg.selectAll("circle")
        .filter((d) => d.isHighlighted)
        .raise(); // Ensure selected points are on top
    }

    function highlightSearchMatches(searchValue) {
      transformedData.forEach((d) => {
        d.isSearchHighlighted = searchValue
          ? d.name.toLowerCase().includes(searchValue.toLowerCase())
          : false;
      });

      // Re-render the scatterplot to update search highlights
      updatePlot(transformedData);
    }

    function updateSelectedPlayersList(players) {
      playerList.html(""); // Clear the list
      if (players.length === 0) {
        playerList.append("li").text("No players found.");
      } else {
        players.forEach((player) => {
          const listItem = playerList
            .append("li")
            .style("display", "block") // Ensure each player is on a new line
            .text(player.name);

          // Add a minus button
          listItem
            .append("span")
            .text("  -")
            .style("color", "red")
            .style("cursor", "pointer")
            .on("click", () => {
              // Remove the player from the highlighted list
              player.isHighlighted = false;
              updatePlot(transformedData);
              updateSelectedPlayersList(
                transformedData.filter((p) => p.isHighlighted)
              );
            });
        });
      }
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
      highlightSearchMatches(searchValue);
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

    d3.select("#radargraph-btn").on("click", () => {
      const highlightedPlayers = transformedData.filter((d) => d.isHighlighted);
      if (highlightedPlayers.length === 0) {
        alert("No players selected!");
      } else {
        const playerNames = highlightedPlayers.map((p) => p.name).join(", ");
        alert(`Opening radar graph for: ${playerNames}`);
      }
    });

    d3.select("#heatmap-btn").on("click", () => {
      const highlightedPlayers = transformedData.filter((d) => d.isHighlighted);
      if (highlightedPlayers.length === 0) {
        alert("No players selected!");
      } else {
        const playerNames = highlightedPlayers.map((p) => p.name).join(", ");
        alert(`Opening heatmap for: ${playerNames}`);
      }
    });

    updatePlot(transformedData);
  });
}).catch(error => {
  console.error("Error loading JSON:", error);
});
