// js/map-canvas.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameMapCanvas');
    if (!canvas) {
        console.error("Canvas element 'gameMapCanvas' not found in the HTML!");
        alert("Error: Canvas element not found. Please check your HTML.");
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D rendering context from canvas.");
        alert("Error: Could not initialize 2D context for the canvas.");
        return;
    }

    const mapImage = new Image();
    // === Image path updated to your filename ===
    mapImage.src = 'images/main_map.png'; // Assuming it's in an 'images' folder

    // === USER ACTION REQUIRED: Define your clickable regions ===
    // You MUST update these coordinates to match your "main_map_01.png" image.
    // Each region: {
    //   name: 'RegionName',        // For your reference and debugging
    //   shape: 'rect',             // Currently only 'rect' is supported by isPointInRegion
    //   coords: [x, y, width, height], // Top-left X, Top-left Y, Width, Height (in pixels)
    //   targetUrl: 'page.html',    // The HTML page to navigate to
    //   hoverColor: 'rgba(R,G,B,A)' // Color for hover effect (R,G,B from 0-255, A from 0-1 for transparency)
    // }
    const regions = [
        {
            name: 'Desert', // Top-left area in the example map
            shape: 'rect',
            coords: [30, 30, 450,300], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'desert.html',
            hoverColor: 'rgba(255, 193, 7, 0.4)' // Semi-transparent yellow
        },
        {
            name: 'Forest', // Top-right area in the example map
            shape: 'rect',
            coords: [600, 50, 350, 400
            ], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'forest.html',
            hoverColor: 'rgba(76, 175, 80, 0.4)' // Semi-transparent green
        },
        {
            name: 'Castle', // Bottom-left area in the example map
            shape: 'rect',
            coords: [150, 700, 250, 200], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'castle.html',
            hoverColor: 'rgba(121, 85, 72, 0.4)' // Semi-transparent brown
        },
        {
            name: 'Mountains', // Bottom-right area in the example map
            shape: 'rect',
            coords: [550, 600, 350, 250], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'mountains.html',
            hoverColor: 'rgba(158, 158, 158, 0.4)' // Semi-transparent gray
        },
        {
            name: 'Lake', // Center-left area with the boat in the example map
            shape: 'rect',
            coords: [30, 500, 300, 200], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'lake.html',
            hoverColor: 'rgba(33, 150, 243, 0.4)' // Semi-transparent blue
        },
        {
            name: 'DirtIsland', // Center-left area with the boat in the example map
            shape: 'rect',
            coords: [430, 500, 200, 200], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'lake.html',
            hoverColor: 'rgba(76, 243, 57, 0.4)' // Semi-transparent blue
        },
        {
            name: 'ForestIsland', // Center-left area with the boat in the example map
            shape: 'rect',
            coords: [250, 400, 200, 150], // EXAMPLE: Adjust x, y, width, height
            targetUrl: 'lake.html',
            hoverColor: 'rgba(18, 61, 214, 0.4)' // Semi-transparent blue
        }
        // Add more regions as needed for other parts of your map.
    ];

    mapImage.onload = () => {
        // Set canvas dimensions to the loaded image's natural dimensions
        canvas.width = mapImage.naturalWidth;
        canvas.height = mapImage.naturalHeight;

        drawMapAndRegions(); // Initial draw of the map

        // Event Listeners
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseout', () => { // Reset hover when mouse leaves canvas
             currentlyHoveredRegion = null; // Clear any active hover state
             drawMapAndRegions(); // Redraw without hover effect
             canvas.style.cursor = 'default'; // Reset cursor
        });
    };

    mapImage.onerror = () => {
        console.error(`Failed to load the map image from: ${mapImage.src}. Check the path and ensure the image exists.`);
        // Provide visual feedback on the canvas itself
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0,0, canvas.width || 300, canvas.height || 150); // Draw a placeholder rectangle
        ctx.fillStyle = 'red';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const canvasCenterX = (canvas.width || 300) / 2;
        const canvasCenterY = (canvas.height || 150) / 2;
        ctx.fillText('Error: Could not load map image.', canvasCenterX, canvasCenterY - 10);
        ctx.font = '14px Arial';
        ctx.fillText(`Path: ${mapImage.src}`, canvasCenterX, canvasCenterY + 10);
        alert(`Error: Could not load map image from ${mapImage.src}. Please check the file path and ensure the image is in the 'images' folder.`);
    };

    function drawMapAndRegions(hoveredRegion = null) {
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the base map image
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

        // If a region is being hovered, draw its hover effect
        if (hoveredRegion) {
            if (hoveredRegion.shape === 'rect') {
                ctx.fillStyle = hoveredRegion.hoverColor || 'rgba(0, 0, 0, 0.2)'; // Default hover color if not specified
                const [x, y, w, h] = hoveredRegion.coords;
                ctx.fillRect(x, y, w, h);
            }
            // Future: Add drawing logic for other shapes like 'circle' or 'polygon' here
        }
    }

    function getMousePos(canvasElement, event) {
        const rect = canvasElement.getBoundingClientRect();
        // Scale mouse coordinates to match canvas resolution, especially if CSS resizes the canvas element
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
            // Check if the point (point.x, point.y) is within the rectangle defined by region.coords
            return point.x >= rx && point.x <= rx + rwidth &&
                   point.y >= ry && point.y <= ry + rheight;
        }
        // Future: Add hit detection for other shapes like 'circle' or 'polygon' here
        // For a circle: check if distance from point to center <= radius
        // For a polygon: use a point-in-polygon algorithm
        return false;
    }

    function handleClick(event) {
        const mousePos = getMousePos(canvas, event);

        for (const region of regions) {
            if (isPointInRegion(mousePos, region)) {
                console.log(`Clicked on ${region.name}. Navigating to ${region.targetUrl}`);
                window.location.href = region.targetUrl; // Navigate to the new page
                return; // Exit after the first matched region is found and actioned
            }
        }
        console.log(`Clicked at [${Math.round(mousePos.x)}, ${Math.round(mousePos.y)}] - no region found.`);
    }

    let currentlyHoveredRegion = null; // Keep track of the currently hovered region

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
            // Only redraw if the hovered region has changed to avoid unnecessary redraws
            if (foundRegionToHover !== currentlyHoveredRegion) {
                currentlyHoveredRegion = foundRegionToHover;
                drawMapAndRegions(currentlyHoveredRegion);
            }
        } else {
            canvas.style.cursor = 'default'; // Reset cursor
            // Only redraw if there was a previously hovered region to clear its effect
            if (currentlyHoveredRegion !== null) {
                currentlyHoveredRegion = null;
                drawMapAndRegions(); // Redraw without any hover effect
            }
        }
    }
});
