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
                    # If pixel is close to white/light color, make it transparent
                    if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                        new_data.append((255, 255, 255, 0))  # Transparent
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
            print(f"  ⚠️  No frames found in {os.path.basename(input_path)}")
            return False
    except Exception as e:
        print(f"  ❌ Error processing {os.path.basename(input_path)}: {str(e)}")
        return False

if __name__ == "__main__":
    base_dir = "/Users/evrenpekdemir/kurtarltc/ltcnew/src/assets/animations"
    files_to_process = ["walker.gif", "run_forrest.gif"]
    
    print(f"Processing {len(files_to_process)} specific GIF files...\n")
    
    for filename in files_to_process:
        file_path = os.path.join(base_dir, filename)
        if os.path.exists(file_path):
            print(f"Processing: {filename}...")
            if remove_white_background(file_path, file_path, threshold=200):
                print(f"  ✅ Successfully removed background from {filename}")
            else:
                print(f"  ❌ Failed to process {filename}")
        else:
            print(f"  ⚠️  File not found: {filename}")
        print()
