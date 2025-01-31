import { DataManager } from './datamanager.js';

function showPlayerModal(playerName) {
  const modalElement = document.getElementById("playerModal");

  if (!modalElement) {
    console.error("Modal element not found!");
    return;
  }

  // Retrieve player data from DataManager
  const playerData = DataManager.getFilteredData().find(p => p.Player === playerName);

  if (!playerData) {
    console.warn(`Player data not found for: ${playerName}`);
    return;
  }

  // Update modal content with player information
  document.getElementById("playerModalLabel").innerText = playerName;
  document.getElementById("player-info").innerHTML = `
        <strong>Club:</strong> ${playerData.Squad || 'Unknown'}<br>
        <strong>Position:</strong> ${playerData.Pos || 'Unknown'}<br>
        <strong>Age:</strong> ${playerData.Age || 'N/A'}<br>
        <strong>Goals:</strong> ${playerData.Goals || 0}<br>
        <strong>Assists:</strong> ${playerData.Assists || 0}<br>
        <strong>Minutes Played:</strong> ${playerData.Min || 0}
    `;

  // Update visualization links
  document.getElementById("scatter-link").setAttribute("data-player", playerName);
  document.getElementById("heatmap-link").setAttribute("data-player", playerName);

  // Show the modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

// Function to store selected player and navigate to visualization
function storePlayerAndNavigate(event) {
  event.preventDefault();
  const playerName = event.target.getAttribute("data-player");

  const playerData = DataManager.getFilteredData().find(p => p.Player === playerName);
  if (!playerData) {
    console.warn(`Cannot store: Player data not found for ${playerName}`);
    return;
  }

  // Retrieve stored players, add new player if not already selected, and update DataManager
  let selectedPlayers = DataManager.getStoredSelectedPlayers();
  if (!selectedPlayers.some(p => p.Player === playerData.Player)) {
    selectedPlayers.push(playerData);
    DataManager.sendSelectedPlayers(selectedPlayers);
  }

  // Redirect to the selected visualization
  window.location.href = event.target.href;
}

// Attach event listeners to all players and substitutes
document.querySelectorAll('.player, .list-group-item').forEach(element => {
  element.addEventListener('click', function () {
    showPlayerModal(this.innerText);
  });
});

// Attach event listeners to visualization buttons
document.getElementById("scatter-link").addEventListener("click", storePlayerAndNavigate);
document.getElementById("heatmap-link").addEventListener("click", storePlayerAndNavigate);

// Navigation event listeners
document.getElementById('scatter').addEventListener('click', () => {
  window.location.href = 'scatterplot.html';
});

document.getElementById('radargraph').addEventListener('click', () => {
  window.location.href = 'radar.html';
});

document.getElementById('heatmap').addEventListener('click', () => {
  window.location.href = 'heatmap.html';
});

document.getElementById('team').addEventListener('click', () => {
  alert('You are already on the Team page!');
});
