// Load data from the JSON file
d3.json("data/2022-2023_Football_Player_Stats.json").then(data => {
    console.log("Loaded Data:", data);

    // Save the full dataset for filtering
    let fullData = data;

    // Initial table render
    updateHeatmap(fullData);

    // Add event listeners for filters
    d3.select("#min-age").on("input", () => applyFilters(fullData));
    d3.select("#max-age").on("input", () => applyFilters(fullData));
    d3.selectAll("#league-filter input[type=checkbox]").on("change", () => applyFilters(fullData));

    // Function to apply filters and update the heatmap
    function applyFilters(data) {
        // Get the age range values from the input fields
        const minAge = d3.select("#min-age").property("value");
        const maxAge = d3.select("#max-age").property("value");

        // Convert inputs to numbers or set defaults if fields are empty
        const min = minAge ? +minAge : Number.NEGATIVE_INFINITY;
        const max = maxAge ? +maxAge : Number.POSITIVE_INFINITY;

        // Get the selected leagues
        const selectedLeagues = [];
        d3.selectAll("#league-filter input[type=checkbox]").each(function() {
            if (d3.select(this).property("checked")) {
                selectedLeagues.push(d3.select(this).property("value"));
            }
        });

        // Filter data based on age range
        let filteredData = data.filter(player => player.Age >= min && player.Age <= max);

        // Filter data based on selected leagues
        if (selectedLeagues.length > 0) {
            filteredData = filteredData.filter(player => selectedLeagues.includes(player.Comp));
        }

        // Update the heatmap table
        updateHeatmap(filteredData);
    }

    let currentSortColumn = null;
    let currentSortOrder = 'asc';

    // Function to update the heatmap table with heatmap coloring
    function updateHeatmap(data, sortColumn = null, sortOrder = 'asc') {
        // Sort the data if a sort column is provided
        if (sortColumn) {
            data.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a[sortColumn] > b[sortColumn] ? 1 : -1;
                } else {
                    return a[sortColumn] < b[sortColumn] ? 1 : -1;
                }
            });
        } else {
            // Default sort by Goals in descending order
            data.sort((a, b) => b.Goals - a.Goals);
        }

        // Show the top 10 players
        const topPlayers = data.slice(0, 10);

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
        const headers = ['Player', 'Age', 'Squad', 'Pos', 'MP', 'Goals', 'SoT', 'PasTotCmp%', 'Assists'];
        thead.append("tr")
            .selectAll("th")
            .data(headers)
            .enter()
            .append("th")
            .text(d => d)
            .on("click", function(event, column) {
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

        // Create individual color scales for each numeric column
        const colorScales = {
            MP: d3.scaleLinear().domain([d3.min(data, d => d.MP), d3.max(data, d => d.MP)]).range(['#e8f5e9', '#1b5e20']),
            Goals: d3.scaleLinear().domain([d3.min(data, d => d.Goals), d3.max(data, d => d.Goals)]).range(['#e8f5e9', '#1b5e20']),
            SoT: d3.scaleLinear().domain([d3.min(data, d => d.SoT), d3.max(data, d => d.SoT)]).range(['#e8f5e9', '#1b5e20']),
            'PasTotCmp%': d3.scaleLinear().domain([d3.min(data, d => d['PasTotCmp%']), d3.max(data, d => d['PasTotCmp%'])]).range(['#e8f5e9', '#1b5e20']),
            Assists: d3.scaleLinear().domain([d3.min(data, d => d.Assists), d3.max(data, d => d.Assists)]).range(['#e8f5e9', '#1b5e20']),
        };

        // Add table rows
        const rows = tbody.selectAll("tr")
            .data(topPlayers)
            .enter()
            .append("tr");

        // Add table cells with heatmap coloring for numerical values
        rows.selectAll("td")
            .data(row => headers.map(column => row[column]))
            .enter()
            .append("td")
            .text(d => d)
            .style("background-color", (d, i) => {
                const column = headers[i];
                if (colorScales[column]) {
                    return colorScales[column](d);
                }
                return null; // No coloring for non-numeric columns
            });
    }
}).catch(error => {
    console.error("Error loading JSON:", error);
});
