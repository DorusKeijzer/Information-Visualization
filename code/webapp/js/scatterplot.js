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
  // Track selected players globally (same as "locked" in heatmap)
  let highlightedPlayers = [];
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
      minX: null, // Minimum value for X axis
      minY: null, // Minimum value for Y axis
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
    
        const xMatch = !filters.minX || +d.attributes[selectedX] >= filters.minX;
        const yMatch = !filters.minY || +d.attributes[selectedY] >= filters.minY;
    
        return ageMatch && leagueMatch && positionMatch && xMatch && yMatch;
      });
    }

    function updatePlot(data) {
      const filteredData = applyFilters(data);
    
      // Rescale X and Y axes based on min values set in filters
      x.domain([
        filters.minX !== null ? filters.minX : 0, 
        d3.max(filteredData, (d) => +d.attributes[selectedX])
      ]);
    
      y.domain([
        filters.minY !== null ? filters.minY : 0, 
        d3.max(filteredData, (d) => +d.attributes[selectedY])
      ]);
    
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
          highlightedPlayers.some(p => p.name === d.name)
            ? "#A020F0"  // Keep Yellow for Selected Points
            : d.isSearchHighlighted
            ? "#FF4500"  // Keep Red for Search Matches
            : "rgba(50, 205, 50)"  // Keep Transparent Green for Normal Points
        )
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
          const isHighlighted = highlightedPlayers.some(p => p.name === d.name);
          if (isHighlighted) {
            highlightedPlayers = highlightedPlayers.filter(p => p.name !== d.name);
          } else {
            highlightedPlayers.push(d);
          }
        
          updatePlot(transformedData);
          updateHighlightedPlayersList();
        });
    
      // Bring search-highlighted points to the top
      svg.selectAll("circle")
        .filter((d) => d.isSearchHighlighted)
        .raise();
    
      // Bring highlighted points to the front
      svg.selectAll("circle")
        .filter((d) => d.isHighlighted)
        .raise();
    }

    function updatePositionFilterUI() {
      d3.selectAll("#position-filter button").classed("selected", false); // Remove selection from all
      d3.select(`#position-filter button[data-position="${filters.positionCategory}"]`).classed("selected", true); // Highlight the selected button
    }


    function showRadargraphModal(playerNames) {
      console.log("Showing radargraph modal for players:", playerNames);
    
      const modalElement = document.getElementById("playerModal");
      if (!modalElement) {
        console.error("Modal element not found!");
        return;
      }
    
      // Update modal content
      d3.select("#player-info").text(`Selected Players: ${playerNames.join(", ")}`);
    
      // Set links dynamically
      d3.select("#heatmap-link").attr("href", `heatmap.html?players=${encodeURIComponent(playerNames.join(","))}`);
      d3.select("#radar-link").attr("href", `radar.html?players=${encodeURIComponent(playerNames.join(","))}`);
    
      const lockedPlayersList = d3.select("#locked-players-list");
      if (!lockedPlayersList.empty()) {
        lockedPlayersList.html(""); // Clear previous list
        if (playerNames.length > 0) {
          playerNames.forEach(player => {
            lockedPlayersList.append("li")
              .attr("class", "list-group-item list-group-item-secondary")
              .text(player);
          });
        } else {
          lockedPlayersList.append("li")
            .attr("class", "list-group-item list-group-item-dark")
            .text("No locked players.");
        }
      }
    
      try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } catch (error) {
        console.error("Error showing modal:", error);
      }
    }


    function highlightSearchMatches(searchValue) {
      transformedData.forEach((d) => {
        if (!d.isHighlighted) { // Only update search highlighting if the point is NOT already selected
          d.isSearchHighlighted = searchValue
            ? d.name.toLowerCase().includes(searchValue.toLowerCase())
            : false;
        }
      });

      // Re-render the scatterplot to update search highlights
      updatePlot(transformedData);
    }


    function updateHighlightedPlayersList() {
      playerList.html("");
      if (highlightedPlayers.length === 0) {
        playerList.append("li").text("No players selected.");
      } else {
        highlightedPlayers.forEach((player) => {
          const listItem = playerList.append("li").text(player.name);
    
          listItem.append("button")
            .text("Remove")
            .on("click", () => {
              highlightedPlayers = highlightedPlayers.filter(p => p.name !== player.name);
              updatePlot(transformedData);
              updateHighlightedPlayersList();
            });
        });
      }
    }

    function showRadargraphModal() {
      if (highlightedPlayers.length === 0) {
        alert("No players selected!");
        return;
      }
    
      const modalElement = document.getElementById("radargraphModal");
      const playerNames = highlightedPlayers.map((p) => p.name);
    
      d3.select("#player-info").text(`Selected Players: ${playerNames.join(", ")}`);
    
      d3.select("#heatmap-link").attr("href", `heatmap.html?players=${encodeURIComponent(playerNames.join(","))}`);
    
      // ✅ Only set the radar link if 7 or fewer players are selected
      if (highlightedPlayers.length <= 7) {
        d3.select("#radar-link")
          .attr("href", `radar.html?players=${encodeURIComponent(playerNames.join(","))}`)
          .style("pointer-events", "auto") // Ensures the link is clickable
          .style("opacity", "1"); // Make sure it's visible
      } else {
        d3.select("#radar-link")
          .attr("href", "#") // Prevents navigation
          .on("click", function (event) {
            alert("The maximum number of players for other views is 7.");
            event.preventDefault(); // 🚨 Stops navigation
          })
          .style("pointer-events", "none") // Disables the link
          .style("opacity", "0.5"); // Makes it look disabled
      }
    
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
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
      updatePositionFilterUI();
      updatePlot(transformedData);
    });

    d3.select("#min-x").on("input", function () {
      filters.minX = this.value ? +this.value : null; // Convert to number or null
      updatePlot(transformedData);
    });
    
    d3.select("#min-y").on("input", function () {
      filters.minY = this.value ? +this.value : null; // Convert to number or null
      updatePlot(transformedData);
    });

    d3.selectAll("#league-filter input[type=checkbox]").on("change", function () {
      const selectedLeagues = Array.from(
        d3.selectAll("#league-filter input[type=checkbox]:checked").nodes()
      ).map((input) => input.value);
      filters.leagues = selectedLeagues;
      updatePlot(transformedData);
    });

    d3.select("#change-view-btn").on("click", () => {
      showRadargraphModal();
    });



    updatePlot(transformedData);
  });

}).catch(error => {
  console.error("Error loading JSON:", error);
});
