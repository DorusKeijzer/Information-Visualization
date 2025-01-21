import { DataManager } from './datamanager.js';

document.addEventListener('DOMContentLoaded', () => {
    let lockedPlayers = [];
    let currentSortColumn = null;
    let currentSortOrder = 'asc';

    const container = d3.select("#heatmap-container");
    let colorScales = {};

    // Initialize color scales
    function initializeColorScales(data) {
        console.log("Initializing color scales with data:", data);
        colorScales = {
            MP: d3.scaleLinear().domain(getClippedDomain(data, 'MP')).range(['#e8f5e9', '#1b5e20']),
            Goals: d3.scaleLinear().domain(getClippedDomain(data, 'Goals')).range(['#e8f5e9', '#1b5e20']),
            SoT: d3.scaleLinear().domain(getClippedDomain(data, 'SoT')).range(['#e8f5e9', '#1b5e20']),
            'PasTotCmp%': d3.scaleLinear().domain(getClippedDomain(data, 'PasTotCmp%')).range(['#e8f5e9', '#1b5e20']),
            Assists: d3.scaleLinear().domain(getClippedDomain(data, 'Assists')).range(['#e8f5e9', '#1b5e20']),
        };
    }

    // Function to calculate clipped domain for color scales
    function getClippedDomain(data, column, lower = 0.05, upper = 0.95) {
        const values = data.map(d => +d[column]).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length === 0) return [0, 1]; // Default domain for empty data
        const lowerIndex = Math.floor(lower * values.length);
        const upperIndex = Math.ceil(upper * values.length - 1);
        return [values[lowerIndex], values[upperIndex]];
    }

    // Update the heatmap
    function updateHeatmap(data) {
        console.log("Updating heatmap with data:", data);
        container.selectAll("*").remove();

        if (data.length === 0) {
            container.append('p').text('No data available for the selected filters.');
            return;
        }

        const table = container.append("table").attr("class", "table table-dark table-hover");
        const thead = table.append("thead");
        const tbody = table.append("tbody");

        const headers = ['Lock', 'Player', 'Age', 'Squad', 'Pos', 'MP', 'Goals', 'SoT', 'PasTotCmp%', 'Assists'];

        // Add headers with sorting
        thead.append("tr")
            .selectAll("th")
            .data(headers)
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

        // Add table rows and cells
        const rows = tbody.selectAll("tr")
            .data(data.slice(0, 10)) // Show top 10 players
            .enter()
            .append("tr");

        rows.selectAll("td")
            .data(row => headers.map(column => (column === 'Lock' ? { type: 'lock', row } : row[column])))
            .enter()
            .append("td")
            .each(function (d, i) {
                const column = headers[i];
                if (d && d.type === 'lock') {
                    d3.select(this)
                        .append("button")
                        .text(lockedPlayers.some(p => p.Player === d.row.Player) ? "Unlock" : "Lock")
                        .attr("class", "btn btn-sm btn-secondary")
                        .on("click", () => {
                            console.log("Toggling lock for player:", d.row.Player);
                            toggleLockPlayer(d.row);
                            sortAndRender(DataManager.getFilteredData());
                        });
                } else {
                    d3.select(this)
                        .text(d)
                        .style("background-color", () => {
                            if (colorScales[column] && !isNaN(d)) {
                                return colorScales[column](+d);
                            }
                            return "transparent";
                        });
                }
            });
    }

    // Toggle lock/unlock for a player
    function toggleLockPlayer(player) {
        const isLocked = lockedPlayers.some(p => p.Player === player.Player);
        if (isLocked) {
            console.log("Unlocking player:", player.Player);
            lockedPlayers = lockedPlayers.filter(p => p.Player !== player.Player);
        } else {
            console.log("Locking player:", player.Player);
            lockedPlayers.push(player);
        }
        console.log("Current locked players:", lockedPlayers);

        // Reapply filters and render
        sortAndRender(DataManager.getFilteredData());
    }

    // Sort and render data
    function sortAndRender(data) {
        console.log("Sorting data. Locked players:", lockedPlayers);

        // Combine locked players with filtered data
        const uniqueLockedPlayers = lockedPlayers.filter(player =>
            !data.some(filteredPlayer => filteredPlayer.Player === player.Player)
        );
        const unlockedPlayers = data.filter(player =>
            !lockedPlayers.some(locked => locked.Player === player.Player)
        );

        // Sort unlocked players
        if (currentSortColumn) {
            unlockedPlayers.sort((a, b) => {
                if (currentSortOrder === 'asc') {
                    return +a[currentSortColumn] - +b[currentSortColumn];
                } else {
                    return +b[currentSortColumn] - +a[currentSortColumn];
                }
            });
        }

        // Combine locked players at the top
        const combinedData = [...lockedPlayers, ...unlockedPlayers];
        console.log("Combined data after sorting:", combinedData);
        updateHeatmap(combinedData);
    }

    // Register the heatmap with the filtered data
    DataManager.registerListener(data => {
        console.log("Data received from DataManager:", data);
        const combinedData = [
            ...lockedPlayers.filter(player =>
                !data.some(filteredPlayer => filteredPlayer.Player === player.Player)
            ),
            ...data
        ];
        initializeColorScales(data);
        sortAndRender(combinedData);
    });

    // Add event listeners for filters
    d3.select("#min-age").on("input", function () {
        console.log("Min age filter input:", this.value);
        DataManager.updateFilters({ ageRange: { min: +this.value || 0 } });
    });

    d3.select("#max-age").on("input", function () {
        console.log("Max age filter input:", this.value);
        DataManager.updateFilters({ ageRange: { max: +this.value || Infinity } });
    });

    d3.selectAll("#league-filter input[type=checkbox]").on("change", function () {
        const selectedLeagues = Array.from(
            d3.selectAll("#league-filter input[type=checkbox]:checked").nodes()
        ).map(input => input.value);
        console.log("Selected leagues:", selectedLeagues);
        DataManager.updateFilters({ leagues: selectedLeagues });
    });

    d3.select("#player-search").on("input", function () {
        console.log("Search input:", this.value);
        DataManager.updateFilters({ searchTerm: this.value });
    });

    // Add position filter event listener
    d3.selectAll("#position-filter button").on("click", function () {
        const position = d3.select(this).attr("data-position");
        console.log("Position filter selected:", position);
        DataManager.updateFilters({ positionCategory: position });
    });

    // Load the data
    DataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
        Age: value => +value,
        MP: value => +value,
        Goals: value => +value,
        SoT: value => +value,
        'PasTotCmp%': value => +value,
        Assists: value => +value
    });

});
