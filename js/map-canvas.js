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
    }
    // --- End Game State Management ---


    // --- Canvas Map Drawing and Interaction ---
    const mapImage = new Image();
    mapImage.src = 'images/regions/main_map_01.png'; // Path to your main map image

    // IMPORTANT: The 'coords' below are taken from your original code.
    // If your map image (main_map_01.png) has changed visually,
    // you will need to update these [x, y, width, height] values
    // to match the new positions and sizes of your regions on the image.
    const regions = [
        {
            name: 'Desert',
            shape: 'rect',
            coords: [30, 30, 450, 300], // Original coordinates
            targetUrl: 'regions/desert.png',
            hoverColor: 'rgba(255, 193, 7, 0.4)',
            rewards: { coin: 5 }
        },
        {
            name: 'Forest',
            shape: 'rect',
            coords: [600, 50, 350, 400], // Original coordinates
            targetUrl: 'regions/forest.png',
            hoverColor: 'rgba(76, 175, 80, 0.4)',
            rewards: { wood: 15, fish: 1 }
        },
        {
            name: 'Castle',
            shape: 'rect',
            coords: [150, 700, 250, 200], // Original coordinates
            targetUrl: 'regions/castle.png',
            hoverColor: 'rgba(121, 85, 72, 0.4)'
        },
        {
            name: 'Mountains',
            shape: 'rect',
            coords: [550, 600, 350, 250], // Original coordinates
            targetUrl: 'regions/mountains.png',
            hoverColor: 'rgba(158, 158, 158, 0.4)',
            rewards: { stone: 20, coin: 2 }
        },
        {
            name: 'Lake',
            shape: 'rect',
            coords: [30, 500, 300, 200], // Original coordinates
            targetUrl: 'regions/lake.png',
            hoverColor: 'rgba(33, 150, 243, 0.4)',
            rewards: { fish: 3 }
        },
        {
            name: 'DirtIsland',
            shape: 'rect',
            coords: [430, 500, 200, 200], // Original coordinates
            targetUrl: 'regions/lake.png', // Or a specific island page
            hoverColor: 'rgba(188, 143, 143, 0.4)', // Example: RosyBrown
            rewards: { stone: 2 }
        },
        {
            name: 'ForestIsland',
            shape: 'rect',
            coords: [250, 400, 200, 150], // Original coordinates
            targetUrl: 'regions/lake.png', // Or a specific island page
            hoverColor: 'rgba(60, 179, 113, 0.4)', // Example: MediumSeaGreen
            rewards: { wood: 5 }
        }
    ];

    mapImage.onload = () => {
        if (canvas.width === 0 || canvas.height === 0 || canvas.width === 300 && canvas.height === 150) { // Check for default canvas size
            canvas.width = mapImage.naturalWidth;
            canvas.height = mapImage.naturalHeight;
        }
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
        console.error(`Failed to load the map image from: ${mapImage.src}. Check path, file existence, and case sensitivity.`);
        const canvasWidth = canvas.width || 600;
        const canvasHeight = canvas.height || 400;
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0,0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Arial';
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        ctx.fillText('Error: Could not load map image.', centerX, centerY -10);
        ctx.font = '14px Arial';
        ctx.fillText(`Attempted path: ${mapImage.src}`, centerX, centerY + 20);
    };

    function drawMapAndRegions(regionToHover = null) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        if (mapImage.complete && mapImage.naturalWidth > 0) {
            ctx.drawImage(mapImage, 0, 0, canvasWidth, canvasHeight);
        } else {
            ctx.fillStyle = '#ddc';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.font = '14px Arial';
            ctx.fillText('Map image is loading or failed to load...', canvasWidth / 2, canvasHeight / 2);
            return;
        }

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
                console.log(`Clicked on ${region.name}. Navigating to ${region.targetUrl}`);

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
