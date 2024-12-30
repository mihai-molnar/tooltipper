# Tooltipper

A modern, interactive tool for adding tooltips to grid-based images. Perfect for creating interactive image maps with customizable tooltips.

## Features

- Dynamic grid system with adjustable cell size (minimum 5px)
- Upload and display custom background images
- Add, edit, and delete tooltips for any grid cell
- Modern, responsive UI with smooth animations
- Smart tooltip positioning (auto-adjusts based on available space)
- Share functionality with view-only mode
- Comprehensive instructions page
- Cross-browser compatible

## Usage

1. Open the application in a web browser
2. Click the "Instructions" link in the top-right corner for detailed usage guide
3. Use the file input to upload a background image
4. Adjust the grid size using the size control (default 10px)
5. Click on any grid cell to add a tooltip
6. Hover over cells to view tooltips
7. Click on cells with existing tooltips to edit or delete them
8. Use the "Share" button to generate a view-only URL for sharing

## Sharing

The share functionality creates a special URL that contains:
- Your uploaded image (encoded in the URL)
- All tooltip positions and content
- Grid size settings

When someone opens a shared URL, they'll see:
- The image with all tooltips in their correct positions
- A view-only mode without editing capabilities
- The ability to hover and view all tooltips

## Development

This is a vanilla JavaScript application with minimal dependencies:
- LZ-String for URL compression

To run locally:
1. Clone the repository
2. Open `index.html` in a web browser
3. No build process or server required
