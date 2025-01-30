import { DataManager } from './datamanager.js';

document.addEventListener("DOMContentLoaded", async () => {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    const svg = d3
        .select("#scatterplot-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxis = svg.append("g").attr("transform", `translate(0, ${height})`);
    const yAxis = svg.append("g");

    const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    await DataManager.loadData("data/2022-2023_Football_Player_Stats.json");

    // ✅ Load stored selected players from localStorage
    let highlightedPlayers = DataManager.getStoredSelectedPlayers();
    console.log("Loaded stored selected players:", highlightedPlayers);

    if (!highlightedPlayers) highlightedPlayers = [];

    const playerList = d3.select("#player-list");
    let selectedX = "PasTotCmp";
    let selectedY = "PasTotAtt";

    let filters = {
      minAge: null,
      maxAge: null,
      minX: null,
      minY: null,
      leagues: ["Premier League", "La Liga", "Serie A", "Ligue 1", "Bundesliga"],
      searchTerm: "",
      positionCategory: "all",
      minMinutes: null
    };

  function applyFilters(data) {
    return data.filter((d) => {
        const ageMatch =
            (!filters.minAge || +d.Age >= filters.minAge) &&
            (!filters.maxAge || +d.Age <= filters.maxAge);

        const leagueMatch = filters.leagues.includes(d.Comp);

        const positionMatch =
            filters.positionCategory === "all" || d.category === filters.positionCategory;

        const xMatch = !filters.minX || +d[selectedX] >= filters.minX;
        const yMatch = !filters.minY || +d[selectedY] >= filters.minY;

        const minutesMatch = !filters.minMinutes || +d.Min >= filters.minMinutes;  // ✅ ADDED FILTER

        const searchMatch =
            !filters.searchTerm || d.Player.toLowerCase().includes(filters.searchTerm.toLowerCase());

        return ageMatch && leagueMatch && positionMatch && xMatch && yMatch && minutesMatch && searchMatch;
    });
  }

  function updatePlot(data) {
      const filteredData = applyFilters(data);
  
      x.domain([
          filters.minX !== null ? filters.minX : 0,
          d3.max(filteredData, (d) => +d[selectedX])
      ]);
  
      y.domain([
          filters.minY !== null ? filters.minY : 0,
          d3.max(filteredData, (d) => +d[selectedY])
      ]);
  
      xAxis.call(d3.axisBottom(x));
      yAxis.call(d3.axisLeft(y));
  
      const circles = svg.selectAll("circle").data(filteredData, (d) => d.Player);
  
      circles.exit().remove();
  
      circles
          .enter()
          .append("circle")
          .merge(circles)
          .attr("cx", (d) => x(+d[selectedX]))
          .attr("cy", (d) => y(+d[selectedY]))
          .attr("r", 5)
          .attr("fill", (d) =>
              highlightedPlayers.some(p => p.Player === d.Player)
                  ? "#A020F0" // Purple for selected players
                  : d.isSearchHighlighted
                      ? "#FF4500" // Red for search matches
                      : "rgba(50, 205, 50)" // Green for normal points
          )
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .on("mouseover", (event, d) => {
              tooltip
                  .style("opacity", 1)
                  .html(
                      `<strong>${d.Player}</strong><br>${selectedX}: ${+d[selectedX]}<br>${selectedY}: ${+d[selectedY]}`
                  )
                  .style("left", `${event.pageX + 10}px`)
                  .style("top", `${event.pageY - 20}px`);
          })
          .on("mouseout", () => tooltip.style("opacity", 0))
          .on("click", function (event, d) {
              const isHighlighted = highlightedPlayers.some(p => p.Player === d.Player);
              if (isHighlighted) {
                  highlightedPlayers = highlightedPlayers.filter(p => p.Player !== d.Player);
              } else {
                  highlightedPlayers.push(d);
              }
  
              DataManager.sendSelectedPlayers(highlightedPlayers);
              updatePlot(data);
              updateHighlightedPlayersList(); // ✅ Ensure the list updates when a player is selected
          });
  
      svg.selectAll("circle")
          .filter(d => d.isSearchHighlighted)
          .raise();
  
      svg.selectAll("circle")
          .filter(d => highlightedPlayers.some(p => p.Player === d.Player))
          .raise();
  }

  function updateHighlightedPlayersList() {
      playerList.html("");
      if (highlightedPlayers.length === 0) {
          playerList.append("li").text("No players selected.");
      } else {
          highlightedPlayers.forEach(player => {
              const listItem = playerList.append("li").text(player.Player);
              listItem.append("button")
                  .text("Remove")
                  .on("click", () => {
                      highlightedPlayers = highlightedPlayers.filter(p => p.Player !== player.Player);
                      DataManager.sendSelectedPlayers(highlightedPlayers);
                      updatePlot(DataManager.getFilteredData());
                      updateHighlightedPlayersList();
                  });
          });
      }
  }

    d3.select("#x-axis-select").on("change", function () {
        selectedX = this.value;
        updatePlot(DataManager.getFilteredData());
    });

    d3.select("#y-axis-select").on("change", function () {
        selectedY = this.value;
        updatePlot(DataManager.getFilteredData());
    });

    d3.select("#min-age").on("input", function () {
      filters.minAge = +this.value || null;
      updatePlot(DataManager.getFilteredData());
    });

    d3.select("#max-age").on("input", function () {
        filters.maxAge = +this.value || null;
        updatePlot(DataManager.getFilteredData());
    });

    d3.select("#player-search").on("input", function () {
      const searchValue = this.value.trim().toLowerCase();
      DataManager.getFilteredData().forEach(d => {
          d.isSearchHighlighted = searchValue && d.Player.toLowerCase().includes(searchValue);
      });
  
      updatePlot(DataManager.getFilteredData()); // ✅ Only update colors, do not filter
  });

    d3.select("#min-x").on("input", function () {
        filters.minX = this.value ? +this.value : null;
        updatePlot(DataManager.getFilteredData());
    });

    d3.select("#min-y").on("input", function () {
        filters.minY = this.value ? +this.value : null;
        updatePlot(DataManager.getFilteredData());
    });

    d3.selectAll("#position-filter button").on("click", function () {
        filters.positionCategory = d3.select(this).attr("data-position") || "all";  // ✅ FIXED
        d3.selectAll("#position-filter button").classed("selected", false);
        d3.select(this).classed("selected", true);
        updatePlot(DataManager.getFilteredData());
    });

    d3.select("#min-minutes").on("input", function () {
        const minMinutes = +this.value;
        d3.select("#min-minutes-value").text(minMinutes); // ✅ Update displayed value
        filters.minMinutes = minMinutes; // ✅ Store in filters
        updatePlot(DataManager.getFilteredData()); // ✅ Apply filter
    });

    d3.selectAll("#league-filter input[type=checkbox]").on("change", function () {
        const selectedLeagues = Array.from(d3.selectAll("#league-filter input[type=checkbox]:checked").nodes()).map(input => input.value);
        DataManager.updateFilters({ leagues: selectedLeagues });
    });

    d3.select("#change-view-btn").on("click", () => {
        if (highlightedPlayers.length === 0) {
            alert("No players selected!");
            return;
        }

        const modalElement = document.getElementById("radargraphModal");
        const playerNames = highlightedPlayers.map(p => p.Player);

        d3.select("#player-info").text(`Selected Players: ${playerNames.join(", ")}`);
        d3.select("#heatmap-link").attr("href", `heatmap.html?players=${encodeURIComponent(playerNames.join(","))}`);

        if (highlightedPlayers.length <= 7) {
            d3.select("#radar-link")
                .attr("href", `radar.html?players=${encodeURIComponent(playerNames.join(","))}`)
                .style("pointer-events", "auto")
                .style("opacity", "1");
        } else {
            d3.select("#radar-link")
                .attr("href", "#")
                .on("click", event => {
                    alert("The maximum number of players for other views is 7.");
                    event.preventDefault();
                })
                .style("pointer-events", "none")
                .style("opacity", "0.5");
        }

        try {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } catch (error) {
            console.error("Error showing modal:", error);
        }
    });

    DataManager.registerListener(data => {
        updatePlot(data);
    });

    // ✅ Update the selected players list upon reload
    updateHighlightedPlayersList();
    updatePlot(DataManager.getFilteredData());
});