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

    // Define scales
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Append axes
    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`);

    const yAxis = svg.append("g").attr("class", "y-axis");

    // Tooltip
    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "scatter-tooltip")
        .style("opacity", 0);

    await DataManager.loadData("data/2022-2023_Football_Player_Stats.json");

    let highlightedPlayers = DataManager.getStoredSelectedPlayers() || [];
    console.log("Loaded stored selected players:", highlightedPlayers);

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
        return data.map(d => ({
            ...d,
            GoalsPerGame: (+d.Goals / (+d.Min / 90) || 0),
            TotalShots: Math.ceil((+d.Shots * (+d.Min / 90)) || 0)
        })).filter(d => {
            const ageMatch = (!filters.minAge || +d.Age >= filters.minAge) &&
                            (!filters.maxAge || +d.Age <= filters.maxAge);
    
            const leagueMatch = filters.leagues
                .map(league => league.toLowerCase().trim()) // Normalize league names
                .includes(d.Comp.toLowerCase().trim());
    
            const positionMatch = filters.positionCategory === "all" || d.category === filters.positionCategory;
            const xMatch = !filters.minX || +d[selectedX] >= filters.minX;
            const yMatch = !filters.minY || +d[selectedY] >= filters.minY;
            const minutesMatch = !filters.minMinutes || +d.Min >= filters.minMinutes;
            const searchMatch = !filters.searchTerm || d.Player.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
            return ageMatch && leagueMatch && positionMatch && xMatch && yMatch && minutesMatch && searchMatch;
        });
    }

    function updatePlot(data) {
        const filteredData = applyFilters(data);
        const highlightedNames = new Set(highlightedPlayers.map(p => p.Player));
        const alwaysIncluded = data.filter(d => highlightedNames.has(d.Player));

        const finalData = [...filteredData, ...alwaysIncluded].filter(
            (d, index, self) => self.findIndex(p => p.Player === d.Player) === index
        );

        // Update scales
        x.domain([
            filters.minX !== null ? filters.minX : 0,
            d3.max(finalData, d => +d[selectedX])
        ]);

        y.domain([
            filters.minY !== null ? filters.minY : 0,
            d3.max(finalData, d => +d[selectedY])
        ]);

        // Update axes
        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));

        // Bind data
        const circles = svg.selectAll("circle")
            .data(finalData, d => d.Player);

        // Remove exiting elements
        circles.exit().remove();

        // Enter and update
        circles.enter()
            .append("circle")
            .attr("class", "scatter-circle")
            .merge(circles)
            .attr("cx", d => x(+d[selectedX]))
            .attr("cy", d => y(+d[selectedY]))
            .attr("r", 5)
            .classed("selected", d => highlightedPlayers.some(p => p.Player === d.Player))
            .classed("highlight", d => d.isSearchHighlighted)
            .classed("default", d => !d.isSearchHighlighted && !highlightedPlayers.some(p => p.Player === d.Player))
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.Player}</strong><br>${selectedX}: ${+d[selectedX]}<br>${selectedY}: ${+d[selectedY]}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`)
                    .classed("visible", true);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0).classed("visible", false);
            })
            .on("click", (event, d) => {
                const isHighlighted = highlightedPlayers.some(p => p.Player === d.Player);
                if (isHighlighted) {
                    highlightedPlayers = highlightedPlayers.filter(p => p.Player !== d.Player);
                } else {
                    highlightedPlayers.push(d);
                }

                DataManager.sendSelectedPlayers(highlightedPlayers);
                updatePlot(data);
                updateHighlightedPlayersList();
            });

        // Raise highlighted elements
        svg.selectAll("circle.selected").raise();
        svg.selectAll("circle.highlight").raise();
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
                    .attr("class", "btn-sm")
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
  
      updatePlot(DataManager.getFilteredData());
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
        filters.positionCategory = d3.select(this).attr("data-position") || "all";
        d3.selectAll("#position-filter button").classed("selected", false);
        d3.select(this).classed("selected", true);
        updatePlot(DataManager.getFilteredData());
    });

    d3.select("#min-minutes").on("input", function () {
        const minMinutes = +this.value;
        d3.select("#min-minutes-value").text(minMinutes);
        filters.minMinutes = minMinutes;
        updatePlot(DataManager.getFilteredData());
    });

    d3.selectAll("#league-filter input[type=checkbox]").on("change", function () {
        const selectedLeagues = Array.from(
            d3.selectAll("#league-filter input[type=checkbox]:checked")
            .nodes()
        ).map(input => input.value.trim()); // Trim whitespace
    
        // Update filters
        filters.leagues = selectedLeagues;
        console.log("Updated league filters:", filters.leagues);
    
        // Ensure the plot updates correctly
        updatePlot(DataManager.getFilteredData());
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

    updateHighlightedPlayersList();
    updatePlot(DataManager.getFilteredData());
});