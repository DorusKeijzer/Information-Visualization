
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
    console.log(`Checking player: ${player.Player} (Position: ${player.Pos})`);

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

    console.log(`Relevant stats for ${player.Player} (Position: ${player.Pos}):`, relevantStats);
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

function createRadarMatrix(containerId, data, positionCategory) {
  console.log("Creating radar matrix for data:", data);

  const numPlayers = data.length;
  const margin = { top: 60, right: 0, bottom: 15, left: 60 };
  const width = 160 - margin.left - margin.right;
  const height = 160 - margin.top - margin.bottom;

  const svgContainer = d3.select(containerId)
    .append('svg')
    .attr('width', (width + margin.left + margin.right) * numPlayers)
    .attr('height', (height + margin.top + margin.bottom) * numPlayers)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const relevantAttributes = positionAttributes[positionCategory.toLowerCase()] || [];
  const angleSlice = Math.PI * 2 / relevantAttributes.length;

  const rScale = d3.scaleLinear().range([0, Math.min(width, height) / 1.4]).domain([0, 100]);  // Increase range to 1.4

  // Adjust label positioning to avoid intersection with the chart
  const labelOffset = rScale(100) + 25;  // Increase the label offset to push it further out

  function drawRadarChart(playerData1, playerData2, playerName1, playerName2, xOffset, yOffset, isDiagonal) {
    const playerDataArray1 = relevantAttributes.map(attribute => playerData1[attribute]);
    const playerDataArray2 = relevantAttributes.map(attribute => playerData2[attribute]);

    const radarLine = d3.lineRadial()
      .radius(d => rScale(d))
      .angle((d, i) => i * angleSlice);

    const chartGroup = svgContainer.append('g')
      .attr('transform', `translate(${xOffset}, ${yOffset})`);
    if (xOffset === 0) {
      chartGroup.append('text')
        .attr('x', -2)
        .attr('y', -margin.left + 15)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'end')
        .text(playerName1)
        .style('font-size', '17px')
        .style('fill', 'white');
    }

    // Add column labels on the top row
    if (yOffset === 0) {
      chartGroup.append('text')
        .attr('x', 0)
        .attr('y', -margin.left + 20)
        .attr('text-anchor', 'middle')
        .text(playerName2)
        .style('font-size', '17px')
        .style('fill', 'white');
    }

    // Diagonal case (same player)
    if (isDiagonal) {
      const chart = chartGroup.append('path')
        .data([playerDataArray1])
        .attr('class', 'radar-chart')
        .attr('d', radarLine)
        .style('fill', 'orange')
        .style('stroke', 'orange')
        .style('stroke-width', 2)
        .style('opacity', 0.5);
    }
    // Non-diagonal case (different players)
    else {
      const chart1 = chartGroup.append('path')
        .data([playerDataArray1])
        .attr('class', 'radar-chart')
        .attr('d', radarLine)
        .style('fill', 'blue')
        .style('stroke', 'blue')
        .style('stroke-width', 2)
        .style('opacity', 0.5);

      const chart2 = chartGroup.append('path')
        .data([playerDataArray2])
        .attr('class', 'radar-chart')
        .attr('d', radarLine)
        .style('fill', 'red')
        .style('stroke', 'red')
        .style('stroke-width', 2)
        .style('opacity', 0.5);
    }

    // Draw axes and labels
    const axisLabels = relevantAttributes.map((attribute, i) => {
      const angle = i * angleSlice;
      const label = chartGroup.append('text')
        .attr('x', labelOffset * Math.cos(angle - Math.PI / 2))  // Increase offset here
        .attr('y', labelOffset * Math.sin(angle - Math.PI / 2))  // Increase offset here
        .attr('text-anchor', 'middle')
        .text(attribute)
        .style('visibility', 'hidden')
        .style('fill', 'white');
      return label;
    });

    // Hover interactions for showing axis labels
    chartGroup.on('mouseover', () => {
      axisLabels.forEach(label => label.style('visibility', 'visible'));
    });

    chartGroup.on('mouseout', () => {
      axisLabels.forEach(label => label.style('visibility', 'hidden'));
    });

    // Draw axis lines
    relevantAttributes.forEach((attribute, i) => {
      const angle = i * angleSlice;
      chartGroup.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', rScale(100) * Math.cos(angle - Math.PI / 2))
        .attr('y2', rScale(100) * Math.sin(angle - Math.PI / 2))
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2);
    });
  }
  // Loop through all player pairs and create radar charts
  data.forEach((player1, i) => {
    data.forEach((player2, j) => {
      const xOffset = j * (width + margin.left + margin.right);
      const yOffset = i * (height + margin.top + margin.bottom);

      // Check if it's a diagonal chart (same player)
      const isDiagonal = i === j;

      drawRadarChart(player1, player2, player1.Player, player2.Player, xOffset, yOffset, isDiagonal);
    });
  });
}

// Initialize DataManager and load data
const dataManager = DataManager;

// Register a listener to receive filtered data and create the radar matrix
dataManager.registerListener((filteredData) => {
  const positionCategory = "defender";  // Example: Change this dynamically based on the position
  const transformedData = transformToPercentages(filteredData.slice(9, 13), positionCategory);  // Adjust the number of players shown
  createRadarMatrix('#radar-matrix', transformedData, positionCategory);
});

// Load the data and apply column processing if needed
dataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
  Age: value => parseInt(value),  // Example of column procesing
  // Add any other column processors here as needed
});


