// js/map-canvas.js

document.addEventListener('DOMContentLoaded', () => {
    // Get the canvas element and its 2D rendering context
    const canvas = document.getElementById('gameMapCanvas');
    if (!canvas) {
        console.error("Canvas element 'gameMapCanvas' not found in the HTML!");
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D rendering context from canvas.");
        return;
    }

    // Get DOM elements for displaying resource counts and day count
    // Ensure these paths are correct in your HTML file:
    // e.g., <img src="images/resources/tree.png" class="resource-icon">
    const woodCountEl = document.getElementById('woodCount');
    const coinCountEl = document.getElementById('coinCount');
    const fishCountEl = document.getElementById('fishCount');
    const stoneCountEl = document.getElementById('stoneCount');
    const dayCountEl = document.getElementById('dayCount');

    // --- Game State Management (Resources and Day) ---
    let gameState = {
        resources: {
            wood: 0,
            coin: 0,
            fish: 0,
            stone: 0
        },
        currentDay: 1
    };

    // Variables for click animation
    let clickFlashRegion = null;
    let clickFlashTimeoutId = null;
    const CLICK_FLASH_DURATION = 250; // milliseconds for the flash effect
    const CLICK_FLASH_COLOR = 'rgba(255, 255, 100, 0.75)'; // Bright yellow, semi-transparent

    function loadGameState() {
        const savedGameState = localStorage.getItem('gameMapState');
        if (savedGameState) {
            const loadedState = JSON.parse(savedGameState);
            gameState.currentDay = loadedState.currentDay || 1;
            gameState.resources.wood = (loadedState.resources && loadedState.resources.wood !== undefined) ? loadedState.resources.wood : 0;
            gameState.resources.coin = (loadedState.resources && loadedState.resources.coin !== undefined) ? loadedState.resources.coin : 0;
            gameState.resources.fish = (loadedState.resources && loadedState.resources.fish !== undefined) ? loadedState.resources.fish : 0;
            gameState.resources.stone = (loadedState.resources && loadedState.resources.stone !== undefined) ? loadedState.resources.stone : 0;
        }
        updateUIDisplay();
    }

    function saveGameState() {
        localStorage.setItem('gameMapState', JSON.stringify(gameState));
    }

    function updateUIDisplay() {
        if (woodCountEl) woodCountEl.textContent = gameState.resources.wood;
        if (coinCountEl) coinCountEl.textContent = gameState.resources.coin;
        if (fishCountEl) fishCountEl.textContent = gameState.resources.fish;
        if (stoneCountEl) stoneCountEl.textContent = gameState.resources.stone;
        if (dayCountEl) dayCountEl.textContent = `Day ${gameState.currentDay}`;
    }

    function addResource(type, amount) {
        if (gameState.resources.hasOwnProperty(type)) {
            gameState.resources[type] += amount;
        } else {
            console.warn(`Resource type "${type}" not recognized.`);
        }
    }

    function advanceDay() {
        gameState.currentDay++;
        updateUIDisplay();
        saveGameState();
        console.log(`Advanced to Day ${gameState.currentDay}. New day tasks could trigger here.`);
        // Potentially add logic here for daily resource generation or events
    }
    // --- End Game State Management ---


    // --- Canvas Map Drawing and Interaction ---
    const mapImage = new Image();
    // Path updated based on the directory structure provided in image_e62148.png
    // Assumes index.html is in the root of 'Biomes/', and 'images' is a subfolder.
    mapImage.src = 'images/regions/main_map_01.png';

    const regions = [
        {
            name: 'Desert',
            shape: 'rect',
            coords: [30, 30, 450, 300], // x, y, width, height
            targetUrl: 'regions/desert.html', // Assumes 'regions' folder for HTML files is at the same level as 'js' and 'images'
            hoverColor: 'rgba(255, 193, 7, 0.4)', // Amber
            rewards: { coin: 5 }
        },
        {
            name: 'Forest',
            shape: 'rect',
            coords: [600, 50, 350, 400],
            targetUrl: 'regions/forest.html',
            hoverColor: 'rgba(76, 175, 80, 0.4)', // Green
            rewards: { wood: 15, fish: 1 }
        },
        {
            name: 'Castle',
            shape: 'rect',
            coords: [150, 700, 250, 200],
            targetUrl: 'regions/castle.html',
            hoverColor: 'rgba(121, 85, 72, 0.4)' // Brown
            // No direct rewards from map click assumed for Castle
        },
        {
            name: 'Mountains',
            shape: 'rect',
            coords: [550, 600, 350, 250],
            targetUrl: 'regions/mountains.html',
            hoverColor: 'rgba(158, 158, 158, 0.4)', // Grey
            rewards: { stone: 20, coin: 2 }
        },
        {
            name: 'Lake', // Assumed to be related to fishing2.png
            shape: 'rect',
            coords: [30, 500, 300, 200],
            targetUrl: 'regions/lake.html', // Create lake.html in your regions folder
            hoverColor: 'rgba(33, 150, 243, 0.4)', // Blue
            rewards: { fish: 3 }
        },
        {
            name: 'DirtIsland', // Example, adjust coords and target as needed
            shape: 'rect',
            coords: [430, 500, 200, 200], // Example coordinates
            targetUrl: 'regions/lake.html', // Or a specific 'dirt_island.html'
            hoverColor: 'rgba(188, 143, 143, 0.4)', // RosyBrown like for dirt
            rewards: { stone: 2 }
        },
        {
            name: 'ForestIsland', // Example, adjust coords and target as needed
            shape: 'rect',
            coords: [250, 400, 200, 150], // Example coordinates
            targetUrl: 'regions/lake.html', // Or a specific 'forest_island.html'
            hoverColor: 'rgba(60, 179, 113, 0.4)', // MediumSeaGreen like for a forest island
            rewards: { wood: 5 }
        }
    ];

    mapImage.onload = () => {
        if (canvas.width === 0 || canvas.height === 0) { // Check if canvas dimensions were not set by CSS
            canvas.width = mapImage.naturalWidth;
            canvas.height = mapImage.naturalHeight;
        }
        // If CSS sets canvas.width to 100%, its actual pixel dimensions might still be the default (e.g., 300x150)
        // until the image loads if not set explicitly.
        // For responsive canvas, it's often better to set drawing dimensions from naturalWidth/Height
        // and let CSS handle display scaling.
        // However, if you *want* the canvas drawing surface to match the scaled display size,
        // you might need to adjust this after CSS has taken effect.

        loadGameState(); // Load state and then draw
        drawMapAndRegions(currentlyHoveredRegion); // Draw initial map state

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseout', () => {
            currentlyHoveredRegion = null;
            if (!clickFlashRegion) { // Don't clear flash if mouseout happens during flash
                drawMapAndRegions(null);
            }
            canvas.style.cursor = 'default';
        });

        // Start automatic day advancement: 1 day every minute (60000 ms)
        setInterval(advanceDay, 60000);
        console.log("Automatic day advancement started (1 day per minute).");
    };

    mapImage.onerror = () => {
        console.error(`Failed to load the map image from: ${mapImage.src}. Check path, file existence, and case sensitivity.`);
        ctx.fillStyle = 'lightgray';
        // Use explicit canvas dimensions or fallbacks if not loaded
        const canvasWidth = canvas.width || 600;
        const canvasHeight = canvas.height || 400;
        ctx.fillRect(0,0, canvasWidth, canvasHeight);

        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Arial';
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        ctx.fillText('Error: Could not load map image.', centerX, centerY -10);
        ctx.font = '14px Arial';
        ctx.fillText(`Attempted path: ${mapImage.src}`, centerX, centerY + 20);
        ctx.fillText(`Current time: ${new Date().toLocaleTimeString()}`, centerX, centerY + 40);

    };

    /**
     * Clears the canvas and redraws the map image, hover effects, and click flash.
     * @param {Object|null} regionToHover - The region object to show normal hover for, or null.
     */
    function drawMapAndRegions(regionToHover = null) {
        // Ensure canvas dimensions are available
        const canvasWidth = canvas.width || mapImage.naturalWidth || 600;
        const canvasHeight = canvas.height || mapImage.naturalHeight || 400;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        if (mapImage.complete && mapImage.naturalWidth > 0) { // Check if map image is loaded and valid
            ctx.drawImage(mapImage, 0, 0, canvasWidth, canvasHeight);
        } else {
            // Fallback if image not loaded (though onerror should handle this primarily)
            ctx.fillStyle = '#ddc';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText('Map loading...', canvasWidth / 2, canvasHeight / 2);
            return; // Don't try to draw regions if map isn't there
        }


        // Draw click flash effect if active
        if (clickFlashRegion) {
            ctx.fillStyle = CLICK_FLASH_COLOR;
            const [x, y, w, h] = clickFlashRegion.coords;
            ctx.fillRect(x, y, w, h);
        }
        // Draw normal hover effect if a region is hovered and not currently being flashed
        // or if the flashed region is also the one being hovered (after flash timeout clears clickFlashRegion)
        else if (regionToHover) {
            ctx.fillStyle = regionToHover.hoverColor || 'rgba(0, 0, 0, 0.2)';
            const [x, y, w, h] = regionToHover.coords;
            ctx.fillRect(x, y, w, h);
        }
    }

    function getMousePos(canvasElement, event) {
        const rect = canvasElement.getBoundingClientRect();
        // Calculate scale based on actual rendered size vs. canvas drawing surface size
        const scaleX = canvasElement.width / rect.width;
        const scaleY = canvasElement.height / rect.height;
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    function isPointInRegion(point, region) {
        if (region.shape === 'rect') {
            const [rx, ry, rwidth, rheight] = region.coords;
            return point.x >= rx && point.x <= rx + rwidth &&
                   point.y >= ry && point.y <= ry + rheight;
        }
        // Add other shapes like 'circle' here if needed
        return false;
    }

    function handleClick(event) {
        const mousePos = getMousePos(canvas, event);

        for (const region of regions) {
            if (isPointInRegion(mousePos, region)) {
                console.log(`Clicked on ${region.name}.`);

                // Clear any previous flash timeout and set up new flash
                if (clickFlashTimeoutId) {
                    clearTimeout(clickFlashTimeoutId);
                }
                clickFlashRegion = region;
                drawMapAndRegions(currentlyHoveredRegion); // Redraw immediately to show flash

                clickFlashTimeoutId = setTimeout(() => {
                    clickFlashRegion = null; // Clear the flash state
                    // Redraw with current hover state (if any) after flash duration
                    drawMapAndRegions(currentlyHoveredRegion);
                }, CLICK_FLASH_DURATION);

                // Process rewards
                let resourcesChanged = false;
                if (region.rewards) {
                    for (const resourceType in region.rewards) {
                        if (region.rewards.hasOwnProperty(resourceType)) {
                            addResource(resourceType, region.rewards[resourceType]);
                            resourcesChanged = true;
                        }
                    }
                }

                if (resourcesChanged) {
                    updateUIDisplay();
                    saveGameState();
                }

                // Navigate after flash and rewards
                if (region.targetUrl) {
                    // Delay navigation slightly to allow flash to be visible
                    setTimeout(() => {
                        window.location.href = region.targetUrl;
                    }, CLICK_FLASH_DURATION / 2); // Navigate halfway through flash or adjust as needed
                }
                return; // Exit loop once a region is clicked
            }
        }
    }

    let currentlyHoveredRegion = null;

    function handleMouseMove(event) {
        const mousePos = getMousePos(canvas, event);
        let foundRegionToHover = null;

        for (const region of regions) {
            if (isPointInRegion(mousePos, region)) {
                foundRegionToHover = region;
                break;
            }
        }

        if (foundRegionToHover) {
            canvas.style.cursor = 'pointer';
            if (foundRegionToHover !== currentlyHoveredRegion) {
                currentlyHoveredRegion = foundRegionToHover;
                // Only redraw if not in the middle of a click flash for a *different* region
                // or if the new hover is the region being flashed (which is fine)
                if (!clickFlashRegion || clickFlashRegion === currentlyHoveredRegion) {
                    drawMapAndRegions(currentlyHoveredRegion);
                }
            }
        } else {
            canvas.style.cursor = 'default';
            if (currentlyHoveredRegion !== null) {
                currentlyHoveredRegion = null;
                // Only redraw if not in the middle of a click flash
                if (!clickFlashRegion) {
                    drawMapAndRegions(null);
                }
            }
        }
    }

    // Initial load of game state
    // mapImage.onload will call loadGameState() and drawMapAndRegions() once image is ready.
});
