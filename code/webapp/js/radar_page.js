const jsonFilePath = "../webapp/data/2022-2023_Football_Player_Stats.json";

// Load the JSON file
fetch(jsonFilePath)
  .then(response => response.json())
  .then(data => {
    createLeagueDropdown(data);
    createSquadDropdown(data);
  })
  .catch(error => console.error("Error loading JSON:", error));

// Function to create the league dropdown
function createLeagueDropdown(data) {
  const leagueDropdown = document.getElementById("leagueDropdown");

  // Get all unique leagues
  const leagues = [...new Set(data.map(player => player.Comp))];

  // Populate the league dropdown
  leagues.forEach(league => {
    const option = document.createElement("option");
    option.value = league;
    option.textContent = league;
    leagueDropdown.appendChild(option);
  });

  // Add event listener for league selection (optional functionality)
  leagueDropdown.addEventListener("change", function () {
    const selectedLeague = leagueDropdown.value;
    console.log(`Selected League: ${selectedLeague}`);
    // You can call a function here if the app needs to react to the league change
  });
}

// Function to create the squad dropdown
function createSquadDropdown(data) {
  const squadDropdown = document.getElementById("squadDropdown");

  // Get all unique squads
  const squads = [...new Set(data.map(player => player.Team))];

  // Populate the squad dropdown
  squads.forEach(squad => {
    const option = document.createElement("option");
    option.value = squad;
    option.textContent = squad;
    squadDropdown.appendChild(option);
  });

  // Add event listener for squad selection (optional functionality)
  squadDropdown.addEventListener("change", function () {
    const selectedSquad = squadDropdown.value;
    console.log(`Selected Squad: ${selectedSquad}`);
    // You can call a function here if the app needs to react to the squad change
  });
}

