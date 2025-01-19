// Load data from the JSON file
d3.json("data/2022-2023_Football_Player_Stats.json").then(data => {
    console.log("Loaded Data:", data);
    data.forEach(player => {
        player.MP = +player.MP;
        player.Goals = +player.Goals;
        player.SoT = +player.SoT;
        player['PasTotCmp%'] = +player['PasTotCmp%'];
        player.Assists = +player.Assists;
    });


    // Save the full dataset for filtering
    let fullData = data;
    let lockedPlayers = [];




    // Initial table render
    updateHeatmap(fullData);


    // Add event listeners for filters
    d3.select("#min-age").on("input", () => applyFilters(fullData));
    d3.select("#max-age").on("input", () => applyFilters(fullData));
    d3.selectAll("#league-filter input[type=checkbox]").on("change", () => applyFilters(fullData));


    d3.select("#player-search").on("input", function () {
        const searchTerm = this.value.toLowerCase(); // Get the search term in lowercase


        if (searchTerm === "") {
            applyFilters(fullData); // If search is empty, revert to filters
        } else {
            // Filter the dataset for matching player names
            const searchResults = fullData.filter(player =>
                player.Player.toLowerCase().includes(searchTerm)
            );


            // Update the heatmap with the search results
            updateHeatmap(searchResults);
        }
    });




    // Function to apply filters and update the heatmap
    function applyFilters(data) {
        // Filter data based on age range
        const minAge = d3.select("#min-age").property("value");
        const maxAge = d3.select("#max-age").property("value");
        const min = minAge ? +minAge : Number.NEGATIVE_INFINITY;
        const max = maxAge ? +maxAge : Number.POSITIVE_INFINITY;


        // Get the selected leagues
        const selectedLeagues = [];
        d3.selectAll("#league-filter input[type=checkbox]").each(function () {
            if (d3.select(this).property("checked")) {
                selectedLeagues.push(d3.select(this).property("value"));
            }
        });


        // Filter data based on age range and leagues
        let filteredData = data.filter(player =>
            player.Age >= min && player.Age <= max &&
            (selectedLeagues.length === 0 || selectedLeagues.includes(player.Comp))
        );


        // Combine locked players with filtered data
        const uniqueLockedPlayers = lockedPlayers.filter(player =>
            !filteredData.some(filteredPlayer => filteredPlayer.Player === player.Player)
        );
        filteredData = [...uniqueLockedPlayers, ...filteredData];


        // Update the heatmap with the combined data
        updateHeatmap(filteredData);
    }




    let currentSortColumn = null;
    let currentSortOrder = 'asc';


    function updateHeatmap(data, sortColumn = null, sortOrder = 'asc') {
        // Ensure locked players are included at the top
        const uniqueLockedPlayers = lockedPlayers.filter(player =>
            data.some(row => row.Player === player.Player)
        );


        // Remove locked players from the dataset and keep unlocked players
        const unlockedPlayers = data.filter(player =>
            !lockedPlayers.some(locked => locked.Player === player.Player)
        );


        // Sort the unlocked players
        if (sortColumn) {
            unlockedPlayers.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return +a[sortColumn] - +b[sortColumn];
                } else {
                    return +b[sortColumn] - +a[sortColumn];
                }
            });
        } else {
            // Default sort by Goals in descending order
            unlockedPlayers.sort((a, b) => b.Goals - a.Goals);
        }


        // Combine locked and unlocked players
        const combinedData = [...uniqueLockedPlayers, ...unlockedPlayers];


        // Show the top 10 players
        const topPlayers = combinedData.slice(0, 10);


        // Select the heatmap container and clear any existing content
        const container = d3.select("#heatmap-container");
        container.selectAll("*").remove();


        if (topPlayers.length === 0) {
            container.append('p').text('No data available for the selected filters.');
            return;
        }


        // Create the table elements
        const table = container.append("table").attr("class", "table table-dark table-hover");
        const thead = table.append("thead");
        const tbody = table.append("tbody");


        // Add table headers
        const headers = ['Lock', 'Player', 'Age', 'Squad', 'Pos', 'MP', 'Goals', 'SoT', 'PasTotCmp%', 'Assists'];
        thead.append("tr")
            .selectAll("th")
            .data(headers)
            .enter()
            .append("th")
            .text(d => d)
            .on("click", function (event, column) {
                if (column === 'Lock') return; // Skip sorting for "Lock"

                if (currentSortColumn === column) {
                    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortOrder = 'asc';
                }
                currentSortColumn = column;
                updateHeatmap(data, column, currentSortOrder);
                d3.selectAll("th").classed("sorted", false);
                d3.select(this).classed("sorted", true)
                    .classed("asc", currentSortOrder === 'asc')
                    .classed("desc", currentSortOrder === 'desc');
            });


        const colorScales = {
            MP: d3.scaleLinear()
                .domain(getClippedDomain(fullData, 'MP')) // Clipped domain for MP
                .range(['#e8f5e9', '#1b5e20']),
            Goals: d3.scaleLinear()
                .domain(getClippedDomain(fullData, 'Goals'))
                .range(['#e8f5e9', '#1b5e20']),
            SoT: d3.scaleLinear()
                .domain(getClippedDomain(fullData, 'SoT'))
                .range(['#e8f5e9', '#1b5e20']),
            'PasTotCmp%': d3.scaleLinear()
                .domain(getClippedDomain(fullData, 'PasTotCmp%'))
                .range(['#e8f5e9', '#1b5e20']),
            Assists: d3.scaleLinear()
                .domain(getClippedDomain(fullData, 'Assists'))
                .range(['#e8f5e9', '#1b5e20']),
        };









        // Add table rows
        const rows = tbody.selectAll("tr")
            .data(topPlayers)
            .enter()
            .append("tr");


        // Add table cells with heatmap coloring and lock buttons
        rows.selectAll("td")
            .data((row, rowIndex) =>
                headers.map(column => {
                    if (column === 'Lock') {
                        // Handle "Lock" column separately
                        return { type: 'lock', row };
                    }
                    return row[column]; // Return the actual data for other columns
                })
            )
            .enter()
            .append("td")
            .each(function (d, i) {
                if (d && d.type === 'lock') {
                    // Add a "Lock" button for the "Lock" column
                    const button = d3.select(this)
                        .append("button")
                        .text(lockedPlayers.includes(d.row) ? "Unlock" : "Lock")
                        .attr("class", "btn btn-sm btn-secondary")
                        .on("click", () => {
                            if (lockedPlayers.includes(d.row)) {
                                lockedPlayers = lockedPlayers.filter(player => player !== d.row);
                            } else {
                                lockedPlayers.push(d.row);
                            }
                            updateHeatmap(data, currentSortColumn, currentSortOrder);
                        });
                } else {
                    // Handle numeric and non-numeric columns for heatmap coloring
                    const column = headers[i];
                    const numericColumns = ['MP', 'Goals', 'SoT', 'PasTotCmp%', 'Assists']; // Only numeric columns
                    d3.select(this)
                        .text(d)
                        .style("background-color", () => {
                            if (numericColumns.includes(column) && colorScales[column] && !isNaN(d)) {
                                return colorScales[column](+d); // Apply heatmap color
                            }
                            return "transparent"; // Transparent for non-numeric columns
                        });
                }
            });

    }

    function getClippedDomain(data, column, lowerPercentile = 0.05, upperPercentile = 0.95) {
        const sorted = data.map(d => +d[column]).sort((a, b) => a - b);
        const lowerIndex = Math.floor(lowerPercentile * sorted.length);
        const upperIndex = Math.ceil(upperPercentile * sorted.length);

        return [sorted[lowerIndex], sorted[upperIndex]];
    }


    //
    // function calculatePercentile(data, accessor, percentile) {
    //     const sorted = data.map(accessor).sort((a, b) => a - b); // Sort values
    //     const index = Math.floor((percentile / 100) * sorted.length);
    //     return sorted[index];
    // }










}).catch(error => {
    console.error("Error loading JSON:", error);
});

