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
        // keeper: ['Lock', 'Player', 'Age', 'MP', 'Min',  'abs_assists', 'AerWon%', 'Recov', 'CrdY', 'PKcon'] // Goalkeepers
    };

    const columnDescriptions = {
        'Lock': 'Lock this player to keep them selected',
        'Player': 'Player name',
        'Age': 'Age of the player',
        'Pos': 'Position played by the player',
        'MP': 'Matches Played: Total matches player has participated in',
        'Min': 'Minutes Played: Total minutes the player has played',
        'Goals': 'Total goals scored by the player',
        'abs_assists': 'Total amount of assists',
        'SoT%': 'Shots on goal Percentage',
        'PasAss': 'Pass Assists: Total number of assists made per 90 minutes played',
        'TouAttPen': 'Touches in the attacking penalty area per 90 minutes played',
        'PasTotCmp%': 'Pass Completion Percentage: Percentage of total passes completed.',
        'PasProg': 'Progressive Passes: Number of forward passes advancing the ball per 90 minutes played',
        'SCA': 'Shot-Creating Actions: Number of offensive actions leading to a shot per 90 minutes played',
        'Carries': 'Total number of ball carries per 90 minutes played',
        'Tkl': 'Tackles: Number of times player successfully tackled an opponent per 90 minutes played',
        'Int': 'Interceptions: Number of times player intercepted the ball per 90 minutes played',
        'Clr': 'Clearances: Number of times player cleared the ball from the defensive area per 90 minutes played',
        'AerWon%': 'Aerial Duels Won Percentage.',
    };


    function sendToVisualization(targetUrl) {
        if (lockedPlayers.length === 0) {
            console.warn("⚠ No players are locked! Nothing to send.");
            return;
        }

        console.log("✅ Sending the following locked players to visualization:", lockedPlayers);

        // Store selected players in DataManager
        DataManager.sendSelectedPlayers(lockedPlayers);

        // Verify players are correctly stored in localStorage
        const storedPlayers = DataManager.getStoredSelectedPlayers();
        console.log("📝 Players saved and retrieved from DataManager:", storedPlayers);

        // Redirect to the target visualization
        if (targetUrl) {
            window.location.href = targetUrl;
        } else {
            console.warn("⚠ Target URL is not provided. No redirection will occur.");
        }
    }


    function initializeColorScales(data) {
        // console.log("Initializing color scales with data:", data);
        colorScales = displayedColumns.reduce((scales, column) => {
            if (!['Player', 'Age', 'Squad', 'Pos', 'Lock'].includes(column)) {
                let values;

                if (column === 'abs_assists') {
                    // Ensure abs_assists is properly calculated
                    values = data.map(d => {
                        const assists = d.Assists ? +d.Assists : 0;
                        const minutes = d.Min ? +d.Min : 0;
                        return Math.round((assists * minutes) / 90);
                    }).filter(v => !isNaN(v));
                } else {
                    // Standard numerical columns
                    values = data.map(d => +d[column]).filter(v => !isNaN(v));
                }

                if (values.length > 0) {
                    scales[column] = d3.scaleLinear()
                        .domain([Math.min(...values), Math.max(...values)]) // Use full filtered range
                        .range(['#2fff60', '#1b5e20']);
                }
            }
            return scales;
        }, {});

        console.log("Color scales initialized:", colorScales);
    }

    // Create tooltip div
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipHeatmap")
        .style("display", "none");



    function updateHeatmap(data) {
        // console.log("Updating heatmap with data:", data);
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
            .html(column => {
                // Append sorting indicator if it's the currently sorted column
                if (column === currentSortColumn) {
                    return `${column} ${currentSortOrder === 'asc' ? '▲' : '▼'}`;
                }
                return column;
            })
            //  ========================== TOOLTIP HEATMAP FUNCTION ======================================
            .on("mouseover", function (event, column) {
                // Show tooltip with column description
                if (columnDescriptions[column]) {
                    tooltip.style("display", "block")
                        .text(columnDescriptions[column]);
                }
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            })
            .on("click", function (event, column) {
                if (column === 'Lock') return;
                console.log("Sorting column:", column);

                // Toggle sorting order if clicking on the same column, otherwise reset to ascending
                if (currentSortColumn === column) {
                    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortColumn = column;
                    currentSortOrder = 'asc';
                }

                sortAndRender(DataManager.getFilteredData());
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
                                d3.select(this)
                                    .append("span")
                                    .text(d.value)
                                    .attr("class", "player-name clickable")
                                    .on("click", () => {
                                        // Lock the player if not already locked
                                        if (!lockedPlayers.some(p => p.Player === d.row.Player)) {
                                            toggleLockPlayer(d.row);
                                        }
                                        showPlayerModal();
                                    });
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



    function showPlayerModal(playerName) {
        console.log("Showing modal for player:", playerName);

        const modalElement = document.getElementById("playerModal");
        if (!modalElement) {
            console.error("Modal element not found!");
            return;
        }

        // Ensure we only show locked players
        if (lockedPlayers.length === 0) {
            console.warn("⚠ No locked players to display.");
            return;
        }

        // Update modal title
        d3.select("#player-info").text(`Locked Players:`);

        // Clear and update the list with locked players only
        const playerList = d3.select("#locked-players-list");
        playerList.html(""); // Clear previous content

        lockedPlayers.forEach(player => {
            const playerCard = playerList.append("div")
                .attr("class", "player-card p-2 mb-2 border rounded bg-secondary text-white");

            playerCard.append("h6").text(player.Player);
            playerCard.append("p").html(`<strong>Club:</strong> ${player.Squad || 'Unknown'}`);
            playerCard.append("p").html(`<strong>Nation:</strong> ${player.Nation || 'Unknown'}`);
            playerCard.append("p").html(`<strong>Age:</strong> ${player.Age || 'N/A'}`);
        });

        d3.select("#scatterplot-link")
            .attr("href", "#") // Prevent immediate navigation
            .on("click", function (event) {
                event.preventDefault(); // Prevent default behavior
                sendToVisualization("scatterplot.html"); // ✅ Now it correctly calls the function!
            });

        d3.select("#other-visual-link")
            .attr("href", "#")
            .on("click", function (event) {
                event.preventDefault();
                console.log("Other visual link clicked");
            });

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
            // Remove player from lockedPlayers
            lockedPlayers = lockedPlayers.filter(p => p.Player !== player.Player);

            // Update stored selected players in DataManager
            const storedPlayers = DataManager.getStoredSelectedPlayers();
            const updatedStoredPlayers = storedPlayers.filter(p => p.Player !== player.Player);
            DataManager.sendSelectedPlayers(updatedStoredPlayers); // Update localStorage
            console.log(`❌ Removed player from storage: ${player.Player}`);
        } else {
            // Add player to lockedPlayers
            lockedPlayers.push(player);

            // Update stored selected players in DataManager
            const storedPlayers = DataManager.getStoredSelectedPlayers();
            storedPlayers.push(player);
            DataManager.sendSelectedPlayers(storedPlayers); // Update localStorage
            console.log(`✅ Added player to storage: ${player.Player}`);
        }
        sortAndRender(DataManager.getFilteredData());
    }

    function sortAndRender(data) {
        // Check for stored selected players and lock them
        const storedPlayers = DataManager.getStoredSelectedPlayers();
        if (storedPlayers.length > 0) {
            console.log("✅ Locking stored players:", storedPlayers);
            storedPlayers.forEach((storedPlayer) => {
                // Avoid duplicates in lockedPlayers
                if (!lockedPlayers.some((locked) => locked.Player === storedPlayer.Player)) {
                    const playerToLock = data.find((player) => player.Player === storedPlayer.Player);
                    if (playerToLock) {
                        lockedPlayers.push(playerToLock);
                    }
                }
            });
        }

        // Separate locked and unlocked players
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

    d3.select("#min-minutes").on("input", function () {
        const minMinutes = +this.value;
        console.log("Min Minutes filter input:", minMinutes);
        d3.select("#min-minutes-value").text(minMinutes); // Update display value
        DataManager.updateFilters({ minMinutes });
    });


    d3.select("#player-search").on("input", function () {
        DataManager.updateFilters({ searchTerm: this.value });
    });

    d3.selectAll("#position-filter button").on("click", function () {
        const position = d3.select(this).attr("data-position");
        displayedColumns = positionColumns[position] || positionColumns.all;
        console.log("Updated displayed columns:", displayedColumns);
        DataManager.updateFilters({ positionCategory: position });

        // Highlight active position filter
        d3.selectAll("#position-filter button").classed("active-filter", false); // Remove highlight from all
        d3.select(this).classed("active-filter", true); // Highlight selected button
    });


    // Register listener instead of loading data
    DataManager.registerListener(data => {
        initializeColorScales(data);
        sortAndRender(data);
    });

    displayedColumns = positionColumns.all;
    updateHeatmap(DataManager.getFilteredData());

});
