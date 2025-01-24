export const DataManager = (function () {
    let fullData = [];
    let filteredData = [];
    let filters = {
        ageRange: { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY },
        leagues: [],
        searchTerm: "",
        positionCategory: "all", // Default to showing all positions
    };

    const listeners = [];

    // Load data from the JSON file
    function loadData(filePath, columnProcessing = {}) {
        return d3.json(filePath).then(data => {
            fullData = data.map(player => {
                const processedPlayer = { ...player };

                // Apply dynamic column processing
                for (const [key, processor] of Object.entries(columnProcessing)) {
                    if (player.hasOwnProperty(key)) {
                        processedPlayer[key] = processor(player[key]);
                    }
                }

                // Add position category
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
        }).catch(error => {
            console.error("Error loading JSON:", error);
        });
    }

    // Apply all filters
    function applyFilters() {
        const { ageRange, leagues, searchTerm, positionCategory } = filters;
        console.log("Applying filters:", filters);

        filteredData = fullData.filter(player => {
            const inAgeRange = player.Age >= (ageRange.min || Number.NEGATIVE_INFINITY) &&
                player.Age <= (ageRange.max || Number.POSITIVE_INFINITY);
            const inLeagues = leagues.length === 0 || leagues.includes(player.Comp);
            const matchesSearch = player.Player.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPosition = positionCategory === "all" || player.category === positionCategory;

            return inAgeRange && inLeagues && matchesSearch && matchesPosition;
        });

        console.log("Filtered data:", filteredData);
        notifyListeners();
    }

    // Update filter values
    function updateFilters(newFilters) {
        filters = { ...filters, ...newFilters };
        console.log("Updated filters:", filters);
        applyFilters();
    }

    // Register listeners
    function registerListener(callback) {
        listeners.push(callback);
    }

    // Notify listeners
    function notifyListeners() {
        console.log("Notifying listeners with data:", filteredData);
        listeners.forEach(callback => callback(filteredData));
    }

    // Add getFilteredData method
    function getFilteredData() {
        return filteredData;
    }

    return {
        loadData,
        updateFilters,
        registerListener,
        getFilteredData,
    };
})();
