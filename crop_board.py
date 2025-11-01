#!/usr/bin/env python3
"""
Crop the Go board image to remove background, keeping only the board itself.
"""

from PIL import Image
import sys
import os

def find_board_bounds(image):
    """
    Find the bounding box of the board by detecting content vs background.
    Returns (left, top, right, bottom) tuple.
    """
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    width, height = image.size
    pixels = image.load()
    
    # Find the bounding box by detecting non-background pixels
    # We'll look for pixels that are significantly different from the corners
    # (assuming corners are background)
    
    # Sample corner colors to determine background
    corners = [
        pixels[0, 0],
        pixels[width-1, 0],
        pixels[0, height-1],
        pixels[width-1, height-1]
    ]
    
    # Average corner color
    bg_color = tuple(sum(c[i] for c in corners) // len(corners) for i in range(3))
    
    # Threshold: consider pixel different if color difference > threshold
    threshold = 30
    
    # Find top boundary
    top = 0
    for y in range(height):
        row_diff = sum(1 for x in range(width) 
                      if sum(abs(pixels[x, y][i] - bg_color[i]) for i in range(3)) > threshold)
        if row_diff > width * 0.05:  # At least 5% of row is non-background
            top = max(0, y - 5)  # Add small padding
            break
    
    # Find bottom boundary
    bottom = height - 1
    for y in range(height - 1, -1, -1):
        row_diff = sum(1 for x in range(width) 
                      if sum(abs(pixels[x, y][i] - bg_color[i]) for i in range(3)) > threshold)
        if row_diff > width * 0.05:
            bottom = min(height - 1, y + 5)  # Add small padding
            break
    
    # Find left boundary
    left = 0
    for x in range(width):
        col_diff = sum(1 for y in range(height) 
                     if sum(abs(pixels[x, y][i] - bg_color[i]) for i in range(3)) > threshold)
        if col_diff > height * 0.05:  # At least 5% of column is non-background
            left = max(0, x - 5)  # Add small padding
            break
    
    # Find right boundary
    right = width - 1
    for x in range(width - 1, -1, -1):
        col_diff = sum(1 for y in range(height) 
                      if sum(abs(pixels[x, y][i] - bg_color[i]) for i in range(3)) > threshold)
        if col_diff > height * 0.05:
            right = min(width - 1, x + 5)  # Add small padding
            break
    
    return (left, top, right, bottom)

def crop_board_image(input_path, output_path=None):
    """
    Crop the board image to remove background.
    """
    if output_path is None:
        name, ext = os.path.splitext(input_path)
        output_path = f"{name}_cropped{ext}"
    
    print(f"Loading image: {input_path}")
    image = Image.open(input_path)
    original_size = image.size
    print(f"Original size: {original_size[0]}x{original_size[1]}")
    
    # Find board boundaries
    print("Detecting board boundaries...")
    bounds = find_board_bounds(image)
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
    
    output_file = crop_board_image(input_file, "9x9GoBoardBlackBG_cropped.webp")
    print(f"\nDone! Cropped image saved as: {output_file}")

