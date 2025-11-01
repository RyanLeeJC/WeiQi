#!/usr/bin/env python3
"""
Improved script to crop the Go board image, removing background.
Uses edge detection and variance analysis.
"""

from PIL import Image, ImageFilter
import sys
import os

def find_board_bounds_improved(image):
    """
    Find board boundaries using edge detection and variance analysis.
    """
    # Convert to grayscale for analysis
    gray = image.convert('L')
    pixels = gray.load()
    width, height = gray.size
    
    # Apply edge detection filter
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_pixels = edges.load()
    
    # Calculate variance (difference from neighbors) for each row/column
    # Areas with the board will have higher variance
    
    # Analyze rows (top to bottom)
    row_variances = []
    for y in range(height):
        row_variance = sum(edge_pixels[x, y] for x in range(width))
        row_variances.append(row_variance)
    
    # Analyze columns (left to right)
    col_variances = []
    for x in range(width):
        col_variance = sum(edge_pixels[x, y] for y in range(height))
        col_variances.append(col_variance)
    
    # Find where variance significantly increases (board starts)
    # and decreases (board ends)
    
    # For top: find where variance jumps up
    max_variance = max(row_variances)
    threshold = max_variance * 0.1  # 10% of max
    
    top = 0
    for y in range(height // 10, height - height // 10):  # Skip edges
        if row_variances[y] > threshold:
            top = max(0, y - 10)
            break
    
    # For bottom: find where variance drops off
    bottom = height - 1
    for y in range(height - 1, height // 10, -1):
        if row_variances[y] > threshold:
            bottom = min(height - 1, y + 10)
            break
    
    # For left
    max_col_variance = max(col_variances)
    col_threshold = max_col_variance * 0.1
    
    left = 0
    for x in range(width // 10, width - width // 10):
        if col_variances[x] > col_threshold:
            left = max(0, x - 10)
            break
    
    # For right
    right = width - 1
    for x in range(width - 1, width // 10, -1):
        if col_variances[x] > col_threshold:
            right = min(width - 1, x + 10)
            break
    
    return (left, top, right, bottom)

def find_board_bounds_manual(image):
    """
    Alternative: Find board by looking for consistent content area.
    For a 9x9 board, the board should be roughly square and centered.
    """
    width, height = image.size
    
    # If image is mostly board already, try to find the actual board edges
    # by looking for the grid pattern (regular horizontal/vertical lines)
    
    gray = image.convert('L')
    pixels = gray.load()
    
    # Sample center area to determine board color range
    center_x, center_y = width // 2, height // 2
    sample_size = min(width, height) // 4
    
    # Find average color in center area (should be board)
    board_colors = []
    for x in range(center_x - sample_size, center_x + sample_size):
        for y in range(center_y - sample_size, center_y + sample_size):
            if 0 <= x < width and 0 <= y < height:
                board_colors.append(pixels[x, y])
    
    if not board_colors:
        return (0, 0, width - 1, height - 1)
    
    avg_board = sum(board_colors) // len(board_colors)
    
    # Find edges where brightness changes significantly
    threshold = 20
    
    # Find top
    top = 0
    for y in range(height):
        row_avg = sum(pixels[x, y] for x in range(width)) // width
        if abs(row_avg - avg_board) < threshold:
            top = max(0, y - 5)
            break
    
    # Find bottom
    bottom = height - 1
    for y in range(height - 1, -1, -1):
        row_avg = sum(pixels[x, y] for x in range(width)) // width
        if abs(row_avg - avg_board) < threshold:
            bottom = min(height - 1, y + 5)
            break
    
    # Find left
    left = 0
    for x in range(width):
        col_avg = sum(pixels[x, y] for y in range(height)) // height
        if abs(col_avg - avg_board) < threshold:
            left = max(0, x - 5)
            break
    
    # Find right
    right = width - 1
    for x in range(width - 1, -1, -1):
        col_avg = sum(pixels[x, y] for y in range(height)) // height
        if abs(col_avg - avg_board) < threshold:
            right = min(width - 1, x + 5)
            break
    
    return (left, top, right, bottom)

def crop_board_image(input_path, output_path=None, method='improved'):
    """
    Crop the board image.
    """
    if output_path is None:
        name, ext = os.path.splitext(input_path)
        output_path = f"{name}_cropped{ext}"
    
    print(f"Loading image: {input_path}")
    image = Image.open(input_path)
    original_size = image.size
    print(f"Original size: {original_size[0]}x{original_size[1]}")
    
    # Find board boundaries
    print(f"Detecting board boundaries (method: {method})...")
    if method == 'improved':
        bounds = find_board_bounds_improved(image)
    else:
        bounds = find_board_bounds_manual(image)
    
    left, top, right, bottom = bounds
    print(f"Board bounds: left={left}, top={top}, right={right}, bottom={bottom}")
    
    # Crop the image
    cropped = image.crop(bounds)
    cropped_size = cropped.size
    print(f"Cropped size: {cropped_size[0]}x{cropped_size[1]}")
    
    # Save cropped image
    cropped.save(output_path, quality=95)
    print(f"Saved cropped image to: {output_path}")
    
    return output_path

if __name__ == "__main__":
    input_file = "9x9GoBoardBlackBG.webp"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        sys.exit(1)
    
    # Try improved method first
    print("Trying improved edge detection method...")
    output_file = crop_board_image(input_file, "9x9GoBoardBlackBG_cropped.webp", method='improved')
    print(f"\nDone! Cropped image saved as: {output_file}")
    
    # If user wants to manually specify, they can modify the script
    print("\nNote: If the crop is not accurate, you can manually specify crop bounds in the script.")

