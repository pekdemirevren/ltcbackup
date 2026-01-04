from PIL import Image
import os

def remove_white_background(input_path, output_path, threshold=240):
    """Remove white/light background from a GIF"""
    
    try:
        # Open the GIF
        img = Image.open(input_path)
        
        frames = []
        durations = []
        
        try:
            while True:
                # Convert frame to RGBA
                frame = img.convert('RGBA')
                
                # Get pixel data
                datas = frame.getdata()
                
                # Create new data with transparency
                new_data = []
                for item in datas:
                    # If pixel is close to black/dark color, make it transparent
                    if item[0] < threshold and item[1] < threshold and item[2] < threshold:
                        new_data.append((0, 0, 0, 0))  # Transparent
                    else:
                        new_data.append(item)
                
                # Update frame data
                frame.putdata(new_data)
                frames.append(frame)
                
                # Try to get duration
                try:
                    durations.append(img.info.get('duration', 100))
                except:
                    durations.append(100)
                
                # Move to next frame
                img.seek(img.tell() + 1)
        except EOFError:
            pass  # End of frames
        
        # Save as GIF with transparency
        if frames:
            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                duration=durations,
                loop=0,
                disposal=2,  # Clear frame before rendering next
                transparency=0,
                optimize=False
            )
            return True
        else:
            print(f"  ⚠️  No frames found")
            return False
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    input_file = "src/assets/animations/biking.gif"
    
    print(f"Processing: {input_file}...")
    
    if remove_white_background(input_file, input_file, threshold=30):
        print(f"✅ Successfully removed background from biking.gif")
    else:
        print(f"❌ Failed to process biking.gif")
