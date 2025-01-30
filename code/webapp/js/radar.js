import { DataManager } from './datamanager.js';
console.log("AAAAAAAA")

// Existing positionAttributes object remains the same
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

// Create a color map to store player colors
const playerColorMap = new Map();

// Existing transformToPercentages function remains the same
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

let svgContainer; // Global variable to store the SVG container
let radarGroups;  // Global variable to store the radar chart groups
let rotationAngle = 0; // Global variable to store the rotation angle

function createRadarMatrix(containerId, data, positionCategory, sortAttribute = null) {
  // Clear existing content before creating new charts
  d3.select(containerId).selectAll('*').remove();
  console.log("Creating radar matrix for data:", data);
  const numPlayers = data.length;
  
  // Dynamically calculate margins and sizes based on number of players
  const baseWidth = 300;  // Increased base width
  const baseHeight = 300;  // Increased base height
  const margin = { 
    top: 80, 
    right: 30, 
    bottom: 30, 
    left: 80 
  };
  
  // Calculate width and height dynamically
  const width = Math.max(baseWidth / numPlayers, 100);
  const height = Math.max(baseHeight / numPlayers, 100);
  
  svgContainer = d3.select(containerId)
    .append('svg')
    .attr('width', (width + margin.left + margin.right) * numPlayers)
    .attr('height', (height + margin.top + margin.bottom) * numPlayers)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  const relevantAttributes = positionAttributes[positionCategory.toLowerCase()] || [];
  const angleSlice = Math.PI * 2 / relevantAttributes.length;
  const rScale = d3.scaleLinear()
    .range([0, Math.min(width, height) / 2])  // Reduced range to keep charts proportional
    .domain([0, 100]);
  
  const labelOffset = rScale(100) + 20;
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Calculate rotation angle if sortAttribute is provided
  if (sortAttribute) {
    const attributeIndex = relevantAttributes.indexOf(sortAttribute);
    if (attributeIndex !== -1) {
      rotationAngle = -attributeIndex * angleSlice; // Negative for clockwise rotation
    }
  }

  // Assign colors to players if not already assigned
  data.forEach((player, index) => {
    if (!playerColorMap.has(player.Player)) {
      playerColorMap.set(player.Player, colorScale(index));
    }
  });

  function drawRadarChart(playerData1, playerData2, playerName1, playerName2, xOffset, yOffset, isDiagonal, playerIndex1, playerIndex2) {
    const playerDataArray1 = relevantAttributes.map(attribute => playerData1[attribute]);
    const playerDataArray2 = relevantAttributes.map(attribute => playerData2[attribute]);
    
    const radarLine = d3.lineRadial()
      .radius(d => rScale(d))
      .angle((d, i) => i * angleSlice);
    
    // Create a group for the radar chart (will rotate)
    const radarGroup = svgContainer.append('g')
      .attr('transform', `translate(${xOffset}, ${yOffset})`);
    
    // Apply rotation to the radar chart group
    radarGroup
      .transition() // Add transition for smooth animation
      .duration(1000) // Animation duration in milliseconds
      .attr('transform', `translate(${xOffset}, ${yOffset}) rotate(${rotationAngle * (180 / Math.PI)})`); // Convert radians to degrees
    
    // Create a separate group for labels (will not rotate)
    const labelGroup = svgContainer.append('g')
      .attr('transform', `translate(${xOffset}, ${yOffset})`);
    
    // Row labels (left side)
    if (xOffset === 0) {
      labelGroup.append('text')
        .attr('x', 50)
        .attr('y', -50)
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-90)')
        .attr('alignment-baseline', 'middle')
        .text(playerName1)
        .style('font-size', '12px')
        .style('fill', 'white');
    }
    
    // Column labels (top row)
    if (yOffset === 0) {
      labelGroup.append('text')
        .attr('x', 0)
        .attr('y', -margin.top + 10)
        .attr('text-anchor', 'middle')
        .text(playerName2)
        .style('font-size', '12px')
        .style('fill', 'white');
    }
    
    // Diagonal case (same player)
    if (isDiagonal) {
      radarGroup.append('path')
        .data([playerDataArray1])
        .attr('class', 'radar-chart')
        .attr('d', radarLine)
        .style('fill', playerColorMap.get(playerName1))
        .style('stroke', playerColorMap.get(playerName1))
        .style('stroke-width', 2)
        .style('opacity', 0.5);
    }
    // Non-diagonal case (different players)
    else {
      const color1 = playerColorMap.get(playerName1);
      const color2 = playerColorMap.get(playerName2);
      radarGroup.append('path')
        .data([playerDataArray1])
        .attr('class', 'radar-chart')
        .attr('d', radarLine)
        .style('fill', color1)
        .style('stroke', color1)
        .style('stroke-width', 2)
        .style('opacity', 0.5);
      radarGroup.append('path')
        .data([playerDataArray2])
        .attr('class', 'radar-chart')
        .attr('d', radarLine)
        .style('fill', color2)
        .style('stroke', color2)
        .style('stroke-width', 2)
        .style('opacity', 0.5);
    }
    
    // Draw axes and labels
    const axisLabels = relevantAttributes.map((attribute, i) => {
      const angle = i * angleSlice;
      const label = radarGroup.append('text')
        .attr('x', labelOffset * Math.cos(angle - Math.PI / 2))
        .attr('y', labelOffset * Math.sin(angle - Math.PI / 2))
        .attr('text-anchor', 'middle')
        .text(attribute)
        .style('visibility', 'hidden')
        .style('font-size', '10px')
        .style('fill', 'white')
        .attr('transform', `rotate(${(angle * (180 / Math.PI)) + 90}, ${labelOffset * Math.cos(angle - Math.PI / 2)}, ${labelOffset * Math.sin(angle - Math.PI / 2)})`); // Rotate text to align with axis
      return label;
    });
    
    // Hover interactions for showing axis labels
    radarGroup.on('mouseover', () => {
      axisLabels.forEach(label => label.style('visibility', 'visible'));
    });
    
    radarGroup.on('mouseout', () => {
      axisLabels.forEach(label => label.style('visibility', 'hidden'));
    });
    
    // Draw axis lines (inside the radar group so they rotate)
    relevantAttributes.forEach((attribute, i) => {
      const angle = i * angleSlice;
      radarGroup.append('line')
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
      // Show only the top-right diagonal and above (i <= j)
      if (i <= j) {
        const xOffset = (numPlayers - 1 - j) * (width + margin.left /15+ margin.right/15); // Reverse the horizontal axis
        const yOffset = i * (height + margin.top/15 + margin.bottom/15);
        
        // Check if it's a diagonal chart (same player)
        const isDiagonal = i === j;
        drawRadarChart(player1, player2, player1.Player, player2.Player, xOffset, yOffset, isDiagonal, i, j);
      }
    });
  });
}

// Function to create the radar legend
function createRadarLegend(containerId, positionCategory) {
  // Clear existing content before creating the legend
  d3.select(containerId).selectAll('*').remove();

  const width = 200; // Half the size of the original
  const height = 200; // Half the size of the original
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  const svg = d3.select(containerId)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left + width / 2}, ${margin.top + height / 2})`); // Center the legend

  const relevantAttributes = positionAttributes[positionCategory.toLowerCase()] || [];
  const angleSlice = Math.PI * 2 / relevantAttributes.length;
  const rScale = d3.scaleLinear()
    .range([0, Math.min(width, height) / 2])
    .domain([0, 100]);

  const labelOffset = rScale(100)/1.2; // Adjusted for smaller size

  // Draw axes and labels
  relevantAttributes.forEach((attribute, i) => {
    const angle = i * angleSlice;

    // Draw axis line
    svg.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', rScale(100) * Math.cos(angle - Math.PI / 2)/2)
      .attr('y2', rScale(100) * Math.sin(angle - Math.PI / 2)/2)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    // Draw axis label
    svg.append('text')
      .attr('x', labelOffset * Math.cos(angle - Math.PI / 2))
      .attr('y', labelOffset * Math.sin(angle - Math.PI / 2))
      .attr('text-anchor', 'middle')
      .text(attribute)
      .style('font-size', '14px')
      .style('fill', 'white')
      .style('cursor', 'pointer') // Make the text clickable
      .attr('transform', `rotate(${(angle * (180 / Math.PI)) + 90}, ${labelOffset * Math.cos(angle - Math.PI / 2)}, ${labelOffset * Math.sin(angle - Math.PI / 2)})`)
      .on('click', () => sortDataByStat(attribute)); // Sort by the clicked attribute
  });

  // Apply rotation to the legend
  svg.transition()
    .duration(1000)
    .attr('transform', `translate(${margin.left + width / 2}, ${margin.top + height / 2}) rotate(${rotationAngle * (180 / Math.PI)})`);
}

// Initialize DataManager and load data
const dataManager = DataManager;

// Register a listener to receive filtered data and create the radar matrix
dataManager.registerListener((filteredData) => {
  const positionCategory = "defender";  // Example: Change this dynamically based on the position
  const selectedPlayers = dataManager.getStoredSelectedPlayers(); // Fetch selected players from localStorage
  const transformedData = transformToPercentages(selectedPlayers, positionCategory);  // Use selected players
  createRadarMatrix('#radar-matrix', transformedData, positionCategory);
  createRadarLegend('#radar-legend', positionCategory); // Create the legend
});

// Load the data and apply column processing if needed
dataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
  Age: value => parseInt(value),  // Example of column processing
  // Add any other column processors here as needed
});



// Function to update the radar graph and explanation
function updateRadarGraph() {
  const selectedProfile = document.getElementById('profileDropdown').value;

  // Update the explanation div
  const explanationDiv = document.getElementById('explanations');
  explanationDiv.innerHTML = generateExplanation(selectedProfile);

  // Update the list of stats in the UI with clickable elements
  //const statsList = document.getElementById('statsList');
  positionAttributes[selectedProfile].forEach(stat => {
    const listItem = document.createElement('li');
    listItem.textContent = stat;
    listItem.classList.add('stat-item');
    listItem.setAttribute('data-stat', stat);
    listItem.addEventListener('click', () => sortDataByStat(stat));
   //statsList.appendChild(listItem);
  });

  // Re-create the radar matrix with the new profile
  const dataManager = DataManager;

  dataManager.registerListener((filteredData) => {
    const selectedPlayers = dataManager.getStoredSelectedPlayers(); // Fetch selected players from localStorage

    console.log("selected players are:", selectedPlayers)
    const transformedData = transformToPercentages(selectedPlayers, selectedProfile);
    createRadarMatrix('#radar-matrix', transformedData, selectedProfile);
    createRadarLegend('#radar-legend', selectedProfile); // Update the legend
  });

  dataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
    Age: value => parseInt(value),
  });
}

function generateExplanation(profile) {
  const attributeDescriptions = {
    striker: {
      "Goals": "Goals scored",
      "Shots": "Shots total",
      "SoT": "Shots on target",
      "G/Sh": "Goals per shot",
      "Assists": "Assists",
      "PKwon": "Penalty kicks won",
    },
    defender: {
      "Tkl": "Tackles",
      "TklWon": "Tackles won",
      "Blocks": "Shots and passes blocked",
      "Int": "Interceptions",
      "Clr": "Clearances",
      "AerWon": "Aerials won",
    },
    midfielder: {
      "PasTotCmp": "Passes completed",
      "PasTotAtt": "Passes attempted",
      "SCA": "Shot-creating actions",
      "GCA": "Goal-creating actions",
      "CarTotDist": "Total distance moved with the ball",
      "Fls": "Fouls committed",
    },
  };

  const attributes = attributeDescriptions[profile] || {};
  let explanation = "";

  // Loop through the attributes and build the explanation HTML
  for (const [attribute, description] of Object.entries(attributes)) {
    explanation += `<strong>${attribute}:</strong> ${description}<br>`;
  }

  return explanation;
}


function sortDataByStat(stat) {
  const dataManager = DataManager;
  const selectedProfile = document.getElementById('profileDropdown').value;

  // Highlight the clicked stat
  document.querySelectorAll('.stat-item').forEach(item => {
    item.classList.remove('active-stat');
  });
  event.target.classList.add('active-stat');

  dataManager.registerListener((filteredData) => {
    const selectedPlayers = dataManager.getStoredSelectedPlayers(); // Fetch selected players from localStorage
    // Sort the data based on the selected stat
    const sortedData = selectedPlayers.sort((a, b) => {
      // Convert to number for numeric sorting
      const valueA = parseFloat(a[stat]) || 0;
      const valueB = parseFloat(b[stat]) || 0;
      return valueB - valueA; // Sort in descending order
    });

    const transformedData = transformToPercentages(sortedData, selectedProfile);
    createRadarMatrix('#radar-matrix', transformedData, selectedProfile, stat); // Pass the sortAttribute
    createRadarLegend('#radar-legend', selectedProfile); // Update the legend
  });

  dataManager.loadData("data/2022-2023_Football_Player_Stats.json", {
    Age: value => parseInt(value),
  });
}
// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  const initialProfile = 'striker';
  document.getElementById('profileDropdown').value = initialProfile;
  updateRadarGraph();

  // Add event listener for dropdown changes
  document.getElementById('profileDropdown').addEventListener('change', updateRadarGraph);
});

// Export the functions and attributes for potential use in other modules
export { positionAttributes, updateRadarGraph, createRadarMatrix, transformToPercentages };
