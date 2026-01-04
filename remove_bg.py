from PIL import Image
import os
import glob

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
    animations_dir = "/Users/evrenpekdemir/kurtarltc/ltcnew/src/assets/animations"
    
    # Find all GIF files
    gif_files = glob.glob(os.path.join(animations_dir, "*.gif"))
    
    print(f"Found {len(gif_files)} GIF files to process...\n")
    
    success_count = 0
    failed_count = 0
    
    for gif_file in gif_files:
        filename = os.path.basename(gif_file)
        print(f"Processing: {filename}...")
        
        if remove_white_background(gif_file, gif_file, threshold=200):
            print(f"  ✅ Successfully removed background from {filename}")
            success_count += 1
        else:
            failed_count += 1
        print()
    
    print(f"\n{'='*50}")
    print(f"Processing complete!")
    print(f"  ✅ Success: {success_count}")
    if failed_count > 0:
        print(f"  ❌ Failed: {failed_count}")
    print(f"{'='*50}")
