export const DataManager = (function () {
    let fullData = [];
    let filteredData = [];
    let selectedPlayers = [];

    let filters = {
        ageRange: { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY },
        leagues: ["Premier League", "La Liga", "Serie A", "Ligue 1", "Bundesliga"],
        searchTerm: "",
        positionCategory: "all",
        minMinutes: 0,
    };

    const listeners = [];
    const selectionListeners = []; // Ensure this exists

    function loadData(filePath = "data/2022-2023_Football_Player_Stats.json", columnProcessing = {}) {
        return d3.json(filePath).then(data => {
            fullData = data.map(player => {
                const processedPlayer = { ...player };

                // Apply dynamic column processing
                for (const [key, processor] of Object.entries(columnProcessing)) {
                    if (player.hasOwnProperty(key)) {
                        processedPlayer[key] = processor(player[key]);
                    }
                }

                processedPlayer.category = player.Pos.startsWith("DF")
                    ? "defensive"
                    : player.Pos.startsWith("MF")
                        ? "midfield"
                        : player.Pos.startsWith("GK")
                            ? "keeper"
                            : "attacking";

                return processedPlayer;
            });

            console.log("Loaded data:", fullData);
            applyFilters();
        }).catch(error => console.error("Error loading JSON:", error));
    }

    function applyFilters() {
        filteredData = fullData.filter(player => {
            return (
                +player.Age >= +filters.ageRange.min &&
                +player.Age <= +filters.ageRange.max &&
                (filters.leagues.length > 0 && filters.leagues.includes(player.Comp)) &&
                player.Player.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
                (filters.positionCategory === "all" || player.category === filters.positionCategory) &&
                +player.Min >= +filters.minMinutes
            );
        });
        notifyListeners();
    }

    function updateFilters(newFilters) {
        if (newFilters.leagues !== undefined) {
            // If all leagues are deselected, set filters.leagues to an empty array
            filters.leagues = newFilters.leagues.length > 0 ? newFilters.leagues : [];
        }
        filters = { ...filters, ...newFilters };
        applyFilters();
    }


    function registerListener(callback) {
        listeners.push(callback);
    }

    function notifyListeners() {
        listeners.forEach(callback => callback(filteredData));
    }

    function getFilteredData() {
        return filteredData;
    }

    function sendSelectedPlayers(players) {
        selectedPlayers = players;
        localStorage.setItem("selectedPlayers", JSON.stringify(players)); // ✅ Store in localStorage
        console.log("✅ Sending selected players:", selectedPlayers);
        notifySelectionListeners();
    }

    function getStoredSelectedPlayers() {
        const storedPlayers = localStorage.getItem("selectedPlayers");
        return storedPlayers ? JSON.parse(storedPlayers) : [];
    }

    function registerSelectionListener(callback) {
        selectionListeners.push(callback);
    }

    function notifySelectionListeners() {
        selectionListeners.forEach(callback => callback(selectedPlayers));
    }

    // Automatically load data
    loadData();

    return {
        loadData,
        updateFilters,
        registerListener,
        registerSelectionListener, // **This is the function that was missing**
        getFilteredData,
        sendSelectedPlayers,
        getStoredSelectedPlayers,
    };
})();
