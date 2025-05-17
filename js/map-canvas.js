// js/map-canvas.js

document.addEventListener('DOMContentLoaded', () => {
    // Get the canvas element and its 2D rendering context
    const canvas = document.getElementById('gameMapCanvas');
    if (!canvas) {
        console.error("Canvas element 'gameMapCanvas' not found in the HTML!");
        // Optionally, alert the user or display a message on the page
        // For example: document.body.innerHTML = "<p>Error: Canvas element not found. Please check the HTML structure.</p>";
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D rendering context from canvas.");
        // Optionally, alert the user
        return;
    }

    // Get DOM elements for displaying resource counts and day count
    const woodCountEl = document.getElementById('woodCount');   // For tree.png
    const coinCountEl = document.getElementById('coinCount');   // For coin2.png
    const fishCountEl = document.getElementById('fishCount');   // For fish.png
    const stoneCountEl = document.getElementById('stoneCount'); // For rock.png
    const dayCountEl = document.getElementById('dayCount');

    // --- Game State Management (Resources and Day) ---
    let gameState = {
        resources: {
            wood: 0,  // Represents resources from tree.png
            coin: 0,  // Represents resources from coin2.png
            fish: 0,  // Represents resources from fish.png
            stone: 0  // Represents resources from rock.png
        },
        currentDay: 1
    };

    /**
     * Loads the game state from localStorage.
     * If no saved state is found, initializes with default values.
     */
    function loadGameState() {
        const savedGameState = localStorage.getItem('gameMapState');
        if (savedGameState) {
            const loadedState = JSON.parse(savedGameState);
            // Merge loaded state with default structure to ensure all properties exist
            gameState.currentDay = loadedState.currentDay || 1;
            gameState.resources.wood = (loadedState.resources && loadedState.resources.wood) || 0;
            gameState.resources.coin = (loadedState.resources && loadedState.resources.coin) || 0;
            gameState.resources.fish = (loadedState.resources && loadedState.resources.fish) || 0;
            gameState.resources.stone = (loadedState.resources && loadedState.resources.stone) || 0;
        }
        updateUIDisplay(); // Update the UI with loaded or default values
    }

    /**
     * Saves the current game state to localStorage.
     */
    function saveGameState() {
        localStorage.setItem('gameMapState', JSON.stringify(gameState));
    }

    /**
     * Updates the resource counts and day display in the HTML.
     */
    function updateUIDisplay() {
        if (woodCountEl) woodCountEl.textContent = gameState.resources.wood;
        if (coinCountEl) coinCountEl.textContent = gameState.resources.coin;
        if (fishCountEl) fishCountEl.textContent = gameState.resources.fish;
        if (stoneCountEl) stoneCountEl.textContent = gameState.resources.stone;
        if (dayCountEl) dayCountEl.textContent = `Day ${gameState.currentDay}`;
    }

    /**
     * Adds a specified amount to a given resource type.
     * @param {string} type - The type of resource (e.g., 'wood', 'coin').
     * @param {number} amount - The amount to add.
     */
    function addResource(type, amount) {
        if (gameState.resources.hasOwnProperty(type)) {
            gameState.resources[type] += amount;
        } else {
            console.warn(`Resource type "${type}" not recognized.`);
        }
        // Note: updateUIDisplay() and saveGameState() are called in handleClick after all rewards are processed.
    }

    /**
     * Advances the game to the next day.
     * (This function is an example; call it based on your game's progression logic)
     */
    function advanceDay() {
        gameState.currentDay++;
        updateUIDisplay();
        saveGameState();
        console.log(`Advanced to Day ${gameState.currentDay}`);
    }
    // --- End Game State Management ---


    // --- Canvas Map Drawing and Interaction ---
    const mapImage = new Image();
    // === USER ACTION REQUIRED: Ensure this is the correct path to your map image ===
    mapImage.src = 'images/main_map_01.png';

    // === USER ACTION REQUIRED: Define your clickable regions ===
    // Update 'coords' [x, y, width, height] for each region to match your 'main_map_01.png'.
    // Update 'rewards' with the resources gained from each region.
    const regions = [
        {
            name: 'Desert',
            shape: 'rect', // Currently only 'rect' is supported for hit detection
            coords: [30, 30, 250, 180], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'desert.html',   // Page to navigate to
            hoverColor: 'rgba(255, 193, 7, 0.4)', // Semi-transparent yellow for hover
            rewards: { coin: 10, stone: 1 } // Example: Desert yields coins and stone
        },
        {
            name: 'Forest',
            shape: 'rect',
            coords: [300, 20, 320, 250], // EXAMPLE: Adjust
            targetUrl: 'forest.html',
            hoverColor: 'rgba(76, 175, 80, 0.4)', // Semi-transparent green
            rewards: { wood: 15, fish: 1 } // Example: Forest yields wood and maybe some fish if near water
        },
        {
            name: 'Castle',
            shape: 'rect',
            coords: [50, 300, 200, 180], // EXAMPLE: Adjust
            targetUrl: 'castle.html',
            hoverColor: 'rgba(121, 85, 72, 0.4)' // Semi-transparent brown
            // No direct rewards from map click; interactions handled on 'castle.html'
        },
        {
            name: 'Mountains',
            shape: 'rect',
            coords: [380, 340, 250, 150], // EXAMPLE: Adjust
            targetUrl: 'mountains.html',
            hoverColor: 'rgba(158, 158, 158, 0.4)', // Semi-transparent gray
            rewards: { stone: 20, coin: 2 } // Example: Mountains yield stone and some coins
        },
        {
            name: 'Lake', // The area with the boat on the example map
            shape: 'rect',
            coords: [40, 220, 200, 100], // EXAMPLE: Adjust
            targetUrl: 'lake.html',
            hoverColor: 'rgba(33, 150, 243, 0.4)', // Semi-transparent blue
            rewards: { fish: 5 } // Example: Lake yields fish
        }
        // Add more regions as needed for your map
    ];

    /**
     * Handles the successful loading of the map image.
     * Sets canvas dimensions, loads game state, and draws the map.
     */
    mapImage.onload = () => {
        canvas.width = mapImage.naturalWidth;
        canvas.height = mapImage.naturalHeight;

        loadGameState(); // Load saved game state or defaults
        // updateUIDisplay(); // This is called within loadGameState

        drawMapAndRegions(); // Initial draw of the map

        // Add event listeners for canvas interactions
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseout', () => { // When mouse leaves the canvas
             currentlyHoveredRegion = null; // Clear any active hover
             drawMapAndRegions(); // Redraw without hover effect
             canvas.style.cursor = 'default'; // Reset cursor
        });
    };

    /**
     * Handles errors during map image loading.
     * Displays an error message on the canvas.
     */
    mapImage.onerror = () => {
        console.error(`Failed to load the map image from: ${mapImage.src}. Check path and file existence.`);
        // Fallback display on canvas if image fails to load
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0,0, canvas.width || 600, canvas.height || 400); // Default size if canvas has no dimensions
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Arial';
        const centerX = (canvas.width || 600) / 2;
        const centerY = (canvas.height || 400) / 2;
        ctx.fillText('Error: Could not load map image.', centerX, centerY);
        ctx.font = '14px Arial';
        ctx.fillText(`Attempted path: ${mapImage.src}`, centerX, centerY + 20);
    };

    /**
     * Clears the canvas and redraws the map image and any hovered region effect.
     * @param {Object|null} hoveredRegion - The region object currently being hovered, or null.
     */
    function drawMapAndRegions(hoveredRegion = null) {
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the base map image
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

        // If a region is being hovered, draw its hover effect
        if (hoveredRegion) {
            if (hoveredRegion.shape === 'rect') { // Check shape before drawing
                ctx.fillStyle = hoveredRegion.hoverColor || 'rgba(0, 0, 0, 0.2)'; // Default hover if not specified
                const [x, y, w, h] = hoveredRegion.coords; // Destructure coordinates
                ctx.fillRect(x, y, w, h);
            }
            // Future: Add drawing logic for other shapes like 'circle' or 'polygon' if needed
        }
    }

    /**
     * Calculates the mouse position relative to the canvas element.
     * Accounts for canvas scaling if its display size differs from its resolution.
     * @param {HTMLCanvasElement} canvasElement - The canvas element.
     * @param {MouseEvent} event - The mouse event.
     * @returns {Object} An object with x and y coordinates relative to the canvas.
     */
    function getMousePos(canvasElement, event) {
        const rect = canvasElement.getBoundingClientRect(); // Gets the size and position of the canvas on the page
        // Scale mouse coordinates to match canvas internal resolution,
        // especially important if CSS is used to resize the canvas display.
        const scaleX = canvasElement.width / rect.width;
        const scaleY = canvasElement.height / rect.height;

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    /**
     * Checks if a given point is within a specified region.
     * Currently supports rectangular regions.
     * @param {Object} point - An object with x and y coordinates (e.g., mouse position).
     * @param {Object} region - The region object to check against.
     * @returns {boolean} True if the point is in the region, false otherwise.
     */
    function isPointInRegion(point, region) {
        if (region.shape === 'rect') {
            const [rx, ry, rwidth, rheight] = region.coords; // Destructure region coordinates
            // Check if the point (point.x, point.y) is within the rectangle
            return point.x >= rx && point.x <= rx + rwidth &&
                   point.y >= ry && point.y <= ry + rheight;
        }
        // Future: Add hit detection for other shapes (e.g., 'circle', 'polygon')
        return false;
    }

    /**
     * Handles click events on the canvas.
     * Checks if a click occurred within a defined region, processes rewards, and navigates.
     * @param {MouseEvent} event - The click event.
     */
    function handleClick(event) {
        const mousePos = getMousePos(canvas, event);

        for (const region of regions) {
            if (isPointInRegion(mousePos, region)) {
                console.log(`Clicked on ${region.name}.`);
                let resourcesChanged = false;

                // Award resources if defined for the region
                if (region.rewards) {
                    for (const resourceType in region.rewards) {
                        if (region.rewards.hasOwnProperty(resourceType)) {
                            addResource(resourceType, region.rewards[resourceType]);
                            resourcesChanged = true;
                        }
                    }
                }

                // Update UI and save game state only if resources were actually changed
                if (resourcesChanged) {
                    updateUIDisplay();
                    saveGameState();
                }

                // Navigate to the target URL if specified
                if (region.targetUrl) {
                    window.location.href = region.targetUrl;
                }
                return; // Exit after processing the first clicked region
            }
        }
        // Optional: Log clicks that don't hit a region for debugging coordinate setup
        // console.log(`Clicked at [${Math.round(mousePos.x)}, ${Math.round(mousePos.y)}] - no interactive region found.`);
    }

    let currentlyHoveredRegion = null; // Stores the region object currently under the mouse, if any

    /**
     * Handles mouse move events on the canvas.
     * Detects if the mouse is over a defined region and updates hover effects.
     * @param {MouseEvent} event - The mouse move event.
     */
    function handleMouseMove(event) {
        const mousePos = getMousePos(canvas, event);
        let foundRegionToHover = null;

        // Check if the mouse is over any defined region
        for (const region of regions) {
            if (isPointInRegion(mousePos, region)) {
                foundRegionToHover = region;
                break; // Found the topmost region the mouse is over
            }
        }

        if (foundRegionToHover) {
            canvas.style.cursor = 'pointer'; // Change cursor to indicate interactivity
            // Redraw only if the hovered region has changed, to optimize performance
            if (foundRegionToHover !== currentlyHoveredRegion) {
                currentlyHoveredRegion = foundRegionToHover;
                drawMapAndRegions(currentlyHoveredRegion); // Redraw with hover effect
            }
        } else {
            canvas.style.cursor = 'default'; // Reset cursor to default
            // Redraw only if there was a previously hovered region (to clear its effect)
            if (currentlyHoveredRegion !== null) {
                currentlyHoveredRegion = null;
                drawMapAndRegions(); // Redraw without any hover effect
            }
        }
    }

    // Initial game state load is now handled within mapImage.onload
    // to ensure it happens after canvas dimensions are set.
});
