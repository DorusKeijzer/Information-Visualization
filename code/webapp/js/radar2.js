import { DataManager } from './datamanager.js';

const positionAttributes = {
    striker: [
        "Goals",        // Goals scored
        "Shots",        // Shots total
        "SoT",          // Shots on target
        "G/Sh",         // Goals per shot
        "Assists",      // Assists
        "PKwon",        // Penalty kicks won
    ],
    defender: [
        "Tkl",          // Tackles
        "TklWon",       // Tackles won
        "Blocks",       // Shots and passes blocked
        "Int",          // Interceptions
        "Clr",          // Clearances
        "AerWon",       // Aerials won
    ],
    midfielder: [
        "PasTotCmp",    // Passes completed
        "PasTotAtt",    // Passes attempted
        "SCA",          // Shot-creating actions
        "GCA",          // Goal-creating actions
        "CarTotDist",   // Total distance moved with the ball
        "Fls",          // Fouls committed
    ],
};

function transformToPercentages(data, positionCategory) {
    const maxValues = {};
    const relevantAttributes = positionAttributes[positionCategory.toLowerCase()] || [];

    console.log("Relevant attributes:", relevantAttributes);

    // Step 1: Determine max values for each relevant column
    data.forEach(player => {
        console.log(`Checking player: ${player.Name} (Position: ${player.Pos})`);

        // Only process the relevant attributes for all players
        relevantAttributes.forEach(attribute => {
            const value = parseFloat(player[attribute]); // Convert to number
            if (!isNaN(value)) {
                maxValues[attribute] = Math.max(maxValues[attribute] || 0, value);
            }
        });

        // Log relevant stats for this player, only showing the relevant attributes
        const relevantStats = relevantAttributes.reduce((acc, attribute) => {
            acc[attribute] = player[attribute];
            return acc;
        }, {});

        console.log(`Relevant stats for ${player.Name} (Position: ${player.Pos}):`, relevantStats);
    });

    console.log("Max values per attribute:", maxValues);

    // Step 2: Create a transformed dataset with relevant attributes shown for each player
    const percentageData = data.map(player => {
        const transformedPlayer = { ...player };

        relevantAttributes.forEach(attribute => {
            const value = parseFloat(player[attribute]); // Convert to number
            if (!isNaN(value) && maxValues[attribute]) {
                transformedPlayer[attribute] = (value / maxValues[attribute]) * 100;
            }
        });

        return transformedPlayer;
    });

    console.log("Transformed data:", percentageData);
    return percentageData;
}

function createRadarChart(containerId, data, positionCategory) {
    console.log("Creating radar chart for data:", data);
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const radius = Math.min(width, height) / 2;

    const svg = d3.select(containerId)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

    const relevantAttributes = positionAttributes[positionCategory.toLowerCase()] || [];

    const angleSlice = Math.PI * 2 / relevantAttributes.length;

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    // Create the axes
    svg.selectAll('.axis')
        .data(relevantAttributes)
        .enter()
        .append('g')
        .attr('class', 'axis')
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (_, i) => rScale(100) * Math.cos(i * angleSlice - Math.PI / 2))
        .attr('y2', (_, i) => rScale(100) * Math.sin(i * angleSlice - Math.PI / 2))
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2);

    // Add axis labels
    svg.selectAll('.axis-label')
        .data(relevantAttributes)
        .enter()
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', (d, i) => (rScale(100) + 15) * Math.cos(i * angleSlice - Math.PI / 2))
        .attr('y', (d, i) => (rScale(100) + 15) * Math.sin(i * angleSlice - Math.PI / 2))
        .attr('text-anchor', 'middle')
        .text(d => d);

    // Define a color palette for players
    const colors = ['red', 'blue', 'green', 'purple', 'orange'];

    // Function to draw the radar chart for each player's stats
    function drawRadarChart(playerData, playerColor, playerName) {
        const playerDataArray = relevantAttributes.map(attribute => playerData[attribute]);

        const radarLine = d3.lineRadial()
            .radius(d => rScale(d))
            .angle((d, i) => i * angleSlice);

        // Draw radar chart path
        const radarChart = svg.append('path')
            .data([playerDataArray])
            .attr('class', 'radar-chart')
            .attr('d', radarLine)
            .style('fill', playerColor)
            .style('stroke', playerColor)
            .style('stroke-width', 2)
            .style('opacity', 0.3)
            .on('mouseover', function() {
                // Highlight on hover
                d3.select(this).style('opacity', 0.7).style('stroke-width', 4);
                tooltip.style('visibility', 'visible')
                    .text(`Player: ${playerName}`);
            })
            .on('mouseout', function() {
                // Reset highlight
                d3.select(this).style('opacity', 0.3).style('stroke-width', 2);
                tooltip.style('visibility', 'hidden');
            });

        // Tooltip for displaying player name and stats
        const tooltip = d3.select(containerId)
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0,0,0,0.7)')
            .style('color', 'white')
            .style('padding', '5px')
            .style('border-radius', '3px')
            .style('font-size', '12px')
            .style('pointer-events', 'none');
    }

    // Loop through the players and create radar charts
    data.forEach((player, index) => {
        const playerColor = colors[index];  // Get color from the array
        drawRadarChart(player, playerColor, player.Name);
    });
}

// Initialize DataManager and load data
const dataManager = DataManager;

// Register a listener to receive filtered data and create the radar chart
dataManager.registerListener((filteredData) => {
    const positionCategory = "striker";  // Example: Change this dynamically based on the position
    const transformedData = transformToPercentages(filteredData.slice(9, 13), positionCategory);  // Adjust the number of players shown
    createRadarChart('#radar', transformedData, positionCategory);
});

// Load the data and apply column processing if needed
dataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
    Age: value => parseInt(value),  // Example of column processing
    // Add any other column processors here as needed
});

