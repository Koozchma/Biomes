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
    // e.g., <img src="resources/tree.png" class="resource-icon">
    const woodCountEl = document.getElementById('woodCount');   // For resources/tree.png
    const coinCountEl = document.getElementById('coinCount');   // For resources/coin2.png
    const fishCountEl = document.getElementById('fishCount');   // For resources/fish.png
    const stoneCountEl = document.getElementById('stoneCount'); // For resources/rock.png
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
            gameState.resources.wood = (loadedState.resources && loadedState.resources.wood) || 0;
            gameState.resources.coin = (loadedState.resources && loadedState.resources.coin) || 0;
            gameState.resources.fish = (loadedState.resources && loadedState.resources.fish) || 0;
            gameState.resources.stone = (loadedState.resources && loadedState.resources.stone) || 0;
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
    }
    // --- End Game State Management ---


    // --- Canvas Map Drawing and Interaction ---
    const mapImage = new Image();
    // MODIFIED PATH: Assuming your HTML is in the root, and 'regions' is a subfolder.
    // If 'map-canvas.js' is in 'js/' and HTML is in root, this path should be correct.
    mapImage.src = 'regions/main_map_01.png'; // CHANGED from 'images/main_map.png'

    const regions = [
        {
            name: 'Desert',
            shape: 'rect',
            coords: [30, 30, 450, 300],
            targetUrl: 'regions/desert.html', // CHANGED: Added 'regions/' prefix
            hoverColor: 'rgba(255, 193, 7, 0.4)',
            rewards: { coin: 5 }
        },
        {
            name: 'Forest',
            shape: 'rect',
            coords: [600, 50, 350, 400],
            targetUrl: 'regions/forest.html', // CHANGED: Added 'regions/' prefix
            hoverColor: 'rgba(76, 175, 80, 0.4)',
            rewards: { wood: 15, fish: 1 }
        },
        {
            name: 'Castle',
            shape: 'rect',
            coords: [150, 700, 250, 200],
            targetUrl: 'regions/castle.html', // CHANGED: Added 'regions/' prefix
            hoverColor: 'rgba(121, 85, 72, 0.4)'
        },
        {
            name: 'Mountains',
            shape: 'rect',
            coords: [550, 600, 350, 250],
            targetUrl: 'regions/mountains.html', // CHANGED: Added 'regions/' prefix
            hoverColor: 'rgba(158, 158, 158, 0.4)',
            rewards: { stone: 20, coin: 2 }
        },
        {
            name: 'Lake',
            shape: 'rect',
            coords: [30, 500, 300, 200],
            targetUrl: 'regions/lake.html', // CHANGED: Added 'regions/' prefix (assuming lake.html is also in regions)
            hoverColor: 'rgba(33, 150, 243, 0.4)',
            rewards: { fish: 3 }
        },
        {
            name: 'DirtIsland',
            shape: 'rect',
            coords: [430, 500, 200, 200],
            // Assuming 'lake.html' or a specific 'dirt_island.html' would also be in 'regions/'
            targetUrl: 'regions/lake.html', // CHANGED: Added 'regions/' prefix
            hoverColor: 'rgba(76, 243, 57, 0.4)',
            rewards: { stone: 2 }
        },
        {
            name: 'ForestIsland',
            shape: 'rect',
            coords: [250, 400, 200, 150],
            // Assuming 'lake.html' or a specific 'forest_island.html' would also be in 'regions/'
            targetUrl: 'regions/lake.html', // CHANGED: Added 'regions/' prefix
            hoverColor: 'rgba(18, 61, 214, 0.4)',
            rewards: { wood: 5 }
        }
    ];

    mapImage.onload = () => {
        canvas.width = mapImage.naturalWidth;
        canvas.height = mapImage.naturalHeight;
        loadGameState();
        drawMapAndRegions(currentlyHoveredRegion);

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseout', () => {
            currentlyHoveredRegion = null;
            if (!clickFlashRegion) {
                drawMapAndRegions(null);
            }
            canvas.style.cursor = 'default';
        });

        setInterval(advanceDay, 60000);
        console.log("Automatic day advancement started (1 day per minute).");
    };

    mapImage.onerror = () => {
        console.error(`Failed to load the map image from: ${mapImage.src}. Check path and file existence.`);
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0,0, canvas.width || 600, canvas.height || 400);
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Arial';
        const centerX = (canvas.width || 600) / 2;
        const centerY = (canvas.height || 400) / 2;
        ctx.fillText('Error: Could not load map image.', centerX, centerY);
        ctx.font = '14px Arial';
        ctx.fillText(`Attempted path: ${mapImage.src}`, centerX, centerY + 20);
    };

    function drawMapAndRegions(regionToHover = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

        if (clickFlashRegion) {
            ctx.fillStyle = CLICK_FLASH_COLOR;
            const [x, y, w, h] = clickFlashRegion.coords;
            ctx.fillRect(x, y, w, h);
        }
        else if (regionToHover) {
            ctx.fillStyle = regionToHover.hoverColor || 'rgba(0, 0, 0, 0.2)';
            const [x, y, w, h] = regionToHover.coords;
            ctx.fillRect(x, y, w, h);
        }
    }

    function getMousePos(canvasElement, event) {
        const rect = canvasElement.getBoundingClientRect();
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
        return false;
    }

    function handleClick(event) {
        const mousePos = getMousePos(canvas, event);

        for (const region of regions) {
            if (isPointInRegion(mousePos, region)) {
                console.log(`Clicked on ${region.name}.`);

                if (clickFlashTimeoutId) {
                    clearTimeout(clickFlashTimeoutId);
                }
                clickFlashRegion = region;
                drawMapAndRegions(currentlyHoveredRegion);

                clickFlashTimeoutId = setTimeout(() => {
                    clickFlashRegion = null;
                    drawMapAndRegions(currentlyHoveredRegion);
                }, CLICK_FLASH_DURATION);

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

                if (region.targetUrl) {
                    setTimeout(() => {
                        window.location.href = region.targetUrl;
                    }, CLICK_FLASH_DURATION / 2);
                }
                return;
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
                if (!clickFlashRegion || clickFlashRegion === currentlyHoveredRegion) {
                    drawMapAndRegions(currentlyHoveredRegion);
                }
            }
        } else {
            canvas.style.cursor = 'default';
            if (currentlyHoveredRegion !== null) {
                currentlyHoveredRegion = null;
                if (!clickFlashRegion) {
                    drawMapAndRegions(null);
                }
            }
        }
    }
});
