export const DataManager = (function () {
    let fullData = [];
    let filteredData = [];
    let selectedPlayers = [];

    let filters = {
        ageRange: { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY },
        leagues: [],
        searchTerm: "",
        positionCategory: "all",
        minMinutes: 0,
    };

    const listeners = [];

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
                player.Age >= filters.ageRange.min &&
                player.Age <= filters.ageRange.max &&
                (filters.leagues.length === 0 || filters.leagues.includes(player.Comp)) &&
                player.Player.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
                (filters.positionCategory === "all" || player.category === filters.positionCategory) &&
                player.Min >= filters.minMinutes
            );
        });

        notifyListeners();
    }

    function updateFilters(newFilters) {
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

    function setSelectedPlayers(players) {
        selectedPlayers = players;
    }

    function getSelectedPlayers() {
        return selectedPlayers;
    }

    // Automatically load data on script import
    loadData();

    return {
        loadData,
        updateFilters,
        registerListener,
        getFilteredData,
        setSelectedPlayers,
        getSelectedPlayers,
    };
})();
