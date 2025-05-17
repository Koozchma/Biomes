// js/map-canvas.js

document.addEventListener('DOMContentLoaded', () => {
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

    // Resource count elements from the top bar
    const goldCountEl = document.getElementById('goldCount');
    const leafCountEl = document.getElementById('leafCount');
    const acornCountEl = document.getElementById('acornCount');
    const rockCountEl = document.getElementById('rockCount');
    const pailCountEl = document.getElementById('pailCount');
    const dayCountEl = document.getElementById('dayCount');


    // --- Resource and Day Management ---
    let gameState = {
        resources: {
            gold: 0,  // Matches the first icon in the image (coin)
            leaf: 0,  // Matches the second icon
            acorn: 0, // Matches the third icon
            rock: 0,  // Matches the fourth icon
            pail: 0   // Matches the fifth icon
        },
        currentDay: 1
    };

    function loadGameState() {
        const savedGameState = localStorage.getItem('gameMapState');
        if (savedGameState) {
            gameState = JSON.parse(savedGameState);
        }
        updateUIDisplay();
    }

    function saveGameState() {
        localStorage.setItem('gameMapState', JSON.stringify(gameState));
    }

    function updateUIDisplay() {
        if (goldCountEl) goldCountEl.textContent = gameState.resources.gold;
        if (leafCountEl) leafCountEl.textContent = gameState.resources.leaf;
        if (acornCountEl) acornCountEl.textContent = gameState.resources.acorn;
        if (rockCountEl) rockCountEl.textContent = gameState.resources.rock;
        if (pailCountEl) pailCountEl.textContent = gameState.resources.pail;
        if (dayCountEl) dayCountEl.textContent = `Day ${gameState.currentDay}`;
    }

    function addResource(type, amount) {
        if (gameState.resources.hasOwnProperty(type)) {
            gameState.resources[type] += amount;
            // updateUIDisplay(); // Called by saveGameState or after multiple adds
            // saveGameState();
        } else {
            console.warn(`Resource type "${type}" not recognized.`);
        }
    }

    // Example: function to advance day (you'd call this based on game logic)
    // function advanceDay() {
    //     gameState.currentDay++;
    //     updateUIDisplay();
    //     saveGameState();
    // }
    // --- End Resource and Day Management ---


    const mapImage = new Image();
    mapImage.src = 'images/main_map_01.png'; // Ensure this is your map image

    const regions = [
        // === USER ACTION REQUIRED: Update coordinates and rewards ===
        {
            name: 'Desert',
            shape: 'rect',
            coords: [30, 30, 250, 180], // EXAMPLE: Adjust x, y, width, height for your main_map_01.png
            targetUrl: 'desert.html',
            hoverColor: 'rgba(255, 193, 7, 0.4)',
            rewards: { gold: 10, rock: 2 } // Example rewards
        },
        {
            name: 'Forest',
            shape: 'rect',
            coords: [300, 20, 320, 250], // EXAMPLE: Adjust
            targetUrl: 'forest.html',
            hoverColor: 'rgba(76, 175, 80, 0.4)',
            rewards: { leaf: 15, acorn: 5 } // Example rewards
        },
        {
            name: 'Castle',
            shape: 'rect',
            coords: [50, 300, 200, 180], // EXAMPLE: Adjust
            targetUrl: 'castle.html',
            hoverColor: 'rgba(121, 85, 72, 0.4)'
            // No direct resource rewards, page handles interactions
        },
        {
            name: 'Mountains',
            shape: 'rect',
            coords: [380, 340, 250, 150], // EXAMPLE: Adjust
            targetUrl: 'mountains.html',
            hoverColor: 'rgba(158, 158, 158, 0.4)',
            rewards: { rock: 20, gold: 3 } // Example rewards
        },
        {
            name: 'Lake',
            shape: 'rect',
            coords: [40, 220, 200, 100], // EXAMPLE: Adjust
            targetUrl: 'lake.html',
            hoverColor: 'rgba(33, 150, 243, 0.4)',
            rewards: { pail: 1 } // Example: you find a pail
        }
    ];

    mapImage.onload = () => {
        canvas.width = mapImage.naturalWidth;
        canvas.height = mapImage.naturalHeight;
        loadGameState(); // Load resources and day, then draw
        drawMapAndRegions();
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseout', () => {
             currentlyHoveredRegion = null;
             drawMapAndRegions();
             canvas.style.cursor = 'default';
        });
    };

    mapImage.onerror = () => {
        console.error(`Failed to load the map image from: ${mapImage.src}.`);
        // Minimal fallback if image fails
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0,0, canvas.width || 600, canvas.height || 400);
        ctx.fillStyle = 'red'; ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText('Error: Map image not found.', (canvas.width || 600)/2, (canvas.height || 400)/2);
    };

    function drawMapAndRegions(hoveredRegion = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
        if (hoveredRegion && hoveredRegion.shape === 'rect') {
            ctx.fillStyle = hoveredRegion.hoverColor || 'rgba(0, 0, 0, 0.2)';
            const [x, y, w, h] = hoveredRegion.coords;
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
                // Example: Award resources directly from map click if defined
                if (region.rewards) {
                    for (const resourceType in region.rewards) {
                        addResource(resourceType, region.rewards[resourceType]);
                    }
                    // After adding all resources for this click:
                    updateUIDisplay(); // Update the UI once
                    saveGameState();   // Save the new state
                }
                // Navigate after processing rewards
                if (region.targetUrl) {
                    window.location.href = region.targetUrl;
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
                drawMapAndRegions(currentlyHoveredRegion);
            }
        } else {
            canvas.style.cursor = 'default';
            if (currentlyHoveredRegion !== null) {
                currentlyHoveredRegion = null;
                drawMapAndRegions();
            }
        }
    }
});
