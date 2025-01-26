import { DataManager } from './datamanager.js';

document.addEventListener('DOMContentLoaded', () => {
    let lockedPlayers = [];
    let currentSortColumn = null;
    let currentSortOrder = 'asc';

    const container = d3.select("#heatmap-container");
    let colorScales = {};
    let displayedColumns = [];

    const positionColumns = {
        all: ['Lock', 'Player', 'Age', 'Pos', 'MP','Min', 'Goals', 'abs_assists'], // Default columns
        attacking: ['Lock', 'Player', 'Age', 'MP','Min', 'Goals', 'abs_assists', 'SoT%', 'PasAss', 'TouAttPen'], // Forwards
        midfield: ['Lock', 'Player', 'Age',  'MP','Min', 'abs_assists', 'PasTotCmp%', 'PasProg', 'SCA', 'Carries'], // Midfielders
        defensive: ['Lock', 'Player', 'Age', 'MP','Min', 'abs_assists', 'Tkl', 'Int', 'Clr', 'AerWon%'], // Defenders
        keeper: ['Lock', 'Player', 'Age', 'MP', 'Min',  'abs_assists', 'AerWon%', 'Recov', 'CrdY', 'PKcon'] // Goalkeepers
    };




    function initializeColorScales(data) {
        console.log("Initializing color scales with data:", data);
        colorScales = displayedColumns.reduce((scales, column) => {
            if (!['Player', 'Age', 'Squad', 'Pos', 'Lock'].includes(column)) {
                scales[column] = d3.scaleLinear()
                    .domain(getClippedDomain(data, column))
                    .range(['#2fff60', '#1b5e20']);
            }
            return scales;
        }, {});
        console.log("Color scales initialized:", colorScales);
    }


    // Calculate clipped domain
    function getClippedDomain(data, column, lower = 0.05, upper = 0.95) {
        const values = data.map(d => +d[column]).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length === 0) return [0, 1];
        const lowerIndex = Math.floor(lower * values.length);
        const upperIndex = Math.ceil(upper * values.length - 1);
        return [values[lowerIndex], values[upperIndex]];
    }

    function updateHeatmap(data) {
        console.log("Updating heatmap with data:", data);
        console.log("Displayed columns:", displayedColumns);

        container.selectAll("*").remove();

        if (data.length === 0) {
            container.append('p').text('No data available for the selected filters.');
            return;
        }

        const table = container.append("table").attr("class", "table table-dark table-hover");
        const thead = table.append("thead");
        const tbody = table.append("tbody");

        // Create table headers
        thead.append("tr")
            .selectAll("th")
            .data(displayedColumns)
            .enter()
            .append("th")
            .text(d => d)
            .on("click", function (event, column) {
                if (column === 'Lock') return;
                console.log("Sorting column:", column);
                currentSortColumn = column;
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                sortAndRender(data);
            });

        // Create table rows
        const rows = tbody.selectAll("tr")
            .data(data.slice(0, 10)) // Show top 10 players
            .enter()
            .append("tr");

        rows.selectAll("td")
            .data(row => displayedColumns.map(column => {
                if (column === 'abs_assists') {
                    // Calculate abs_assists dynamically
                    const assists = row.Assists ? +row.Assists : 0;
                    const minutes = row.Min ? +row.Min : 0;
                    return { value: Math.round((assists * minutes) / 90), row }; // Return calculated value with row context
                }
                return { value: row[column], row }; // For other columns, return value with row context
            }))
            .enter()
            .append("td")
            .each(function (d, i) {
                const column = displayedColumns[i];
                if (column === 'Lock') {
                    // Handle the lock functionality
                    const isLocked = lockedPlayers.some(p => p.Player === d.row.Player);
                    d3.select(this)
                        .style("background-color", isLocked ? "#ffc107" : "transparent")
                        .append("button")
                        .text(isLocked ? "Unlock" : "Lock")
                        .attr("class", "btn btn-sm btn-secondary")
                        .on("click", () => {
                            console.log("Toggling lock for player:", d.row.Player);
                            toggleLockPlayer(d.row);
                            sortAndRender(DataManager.getFilteredData());
                        });
                } else if (column === 'Player') {
                    // Handle player modal
                    d3.select(this)
                        .append("span")
                        .text(d.value)
                        .attr("class", "player-name clickable")
                        .on("click", () => showPlayerModal(d.row.Player));
                } else {
                    // Handle other columns
                    d3.select(this)
                        .text(d.value)
                        .style("background-color", () => {
                            if (colorScales[column] && !isNaN(d.value)) {
                                return colorScales[column](+d.value);
                            }
                            return "transparent";
                        });
                }
            });
    }



    // Show player modal
    function showPlayerModal(playerName) {
        console.log("Showing modal for player:", playerName);

        const modalElement = document.getElementById("playerModal");
        if (!modalElement) {
            console.error("Modal element not found!");
            return;
        }

        d3.select("#player-info").text(`Selected Player: ${playerName}`);

        d3.select("#scatterplot-link").attr("href", `scatterplot.html?player=${encodeURIComponent(playerName)}`);
        d3.select("#other-visual-link").attr("href", `other-visual.html?player=${encodeURIComponent(playerName)}`);

        const lockedPlayersList = d3.select("#locked-players-list");
        if (!lockedPlayersList.empty()) {
            lockedPlayersList.html(""); // Clear previous list
            if (lockedPlayers.length > 0) {
                lockedPlayers.forEach(player => {
                    lockedPlayersList.append("li")
                        .attr("class", "list-group-item list-group-item-secondary")
                        .text(player.Player);
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

    function toggleLockPlayer(player) {
        const isLocked = lockedPlayers.some(p => p.Player === player.Player);
        if (isLocked) {
            lockedPlayers = lockedPlayers.filter(p => p.Player !== player.Player);
        } else {
            lockedPlayers.push(player);
        }
        sortAndRender(DataManager.getFilteredData());
    }

    function sortAndRender(data) {
        const uniqueLockedPlayers = lockedPlayers.filter(player =>
            !data.some(filteredPlayer => filteredPlayer.Player === player.Player)
        );
        const unlockedPlayers = data.filter(player =>
            !lockedPlayers.some(locked => locked.Player === player.Player)
        );

        if (currentSortColumn) {
            unlockedPlayers.sort((a, b) => {
                let valueA, valueB;

                if (currentSortColumn === 'abs_assists') {
                    // Calculate abs_assists for sorting
                    const assistsA = a.Assists ? +a.Assists : 0;
                    const minutesA = a.Min ? +a.Min : 0;
                    valueA = Math.round((assistsA * minutesA) / 90);

                    const assistsB = b.Assists ? +b.Assists : 0;
                    const minutesB = b.Min ? +b.Min : 0;
                    valueB = Math.round((assistsB * minutesB) / 90);
                } else {
                    // Handle other columns normally
                    valueA = +a[currentSortColumn];
                    valueB = +b[currentSortColumn];
                }

                if (currentSortOrder === 'asc') {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            });
        }

        const combinedData = [...lockedPlayers, ...unlockedPlayers];
        updateHeatmap(combinedData);
    }



    d3.select("#min-age").on("input", function () {
        DataManager.updateFilters({ ageRange: { min: +this.value || 0 } });
    });

    d3.select("#max-age").on("input", function () {
        DataManager.updateFilters({ ageRange: { max: +this.value || Infinity } });
    });

    d3.selectAll("#league-filter input[type=checkbox]").on("change", function () {
        const selectedLeagues = Array.from(
            d3.selectAll("#league-filter input[type=checkbox]:checked").nodes()
        ).map(input => input.value);
        DataManager.updateFilters({ leagues: selectedLeagues });
    });

    d3.select("#player-search").on("input", function () {
        DataManager.updateFilters({ searchTerm: this.value });
    });

    d3.selectAll("#position-filter button").on("click", function () {
        const position = d3.select(this).attr("data-position");
        displayedColumns = positionColumns[position] || positionColumns.all;
        console.log("Updated displayed columns:", displayedColumns);
        DataManager.updateFilters({ positionCategory: position });
    });

    DataManager.registerListener(data => {
        initializeColorScales(data);
        sortAndRender(data);
    });

    DataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
        Min: value => +value, // Parse minutes as a number
        Assists: value => +value, // Parse assists as a number
        abs_assists: row => {
            const assists = row.Assists ? +row.Assists : 0;
            const minutes = row.Min ? +row.Min : 0;
            return Math.round((assists * minutes) / 90); // Calculate and round to nearest integer
        },
        // Add other fields as needed
    });

    displayedColumns = positionColumns.all;
});
