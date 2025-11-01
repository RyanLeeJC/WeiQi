#!/usr/bin/env python3
"""
Calculate the average color of the Go board image.
"""

from PIL import Image
import sys

def calculate_average_color(image_path):
    """Calculate the average RGB color of an image."""
    try:
        with Image.open(image_path) as img:
            # Convert image to RGB if it's not already
            img = img.convert("RGB")
            
            # Get image data
            pixels = list(img.getdata())
            
            # Calculate sum of R, G, B values
            r_sum = 0
            g_sum = 0
            b_sum = 0
            
            for r, g, b in pixels:
                r_sum += r
                g_sum += g
                b_sum += b
            
            # Calculate average
            num_pixels = len(pixels)
            avg_r = r_sum // num_pixels
            avg_g = g_sum // num_pixels
            avg_b = b_sum // num_pixels
            
            return (avg_r, avg_g, avg_b)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    image_file = "9x9GoBoardBlackBG.webp"
    
    avg_color = calculate_average_color(image_file)
    if avg_color:
        print(f"Average color (RGB): {avg_color}")
        print(f"Average color (Hex): #{avg_color[0]:02x}{avg_color[1]:02x}{avg_color[2]:02x}")
        print(f"CSS rgb: rgb({avg_color[0]}, {avg_color[1]}, {avg_color[2]})")

