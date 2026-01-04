import os
import re

files_to_fix = [
    "src/assets/icons/icon-svg-files/seated-cable-row-2025-12-08T12-18-14.tsx",
    "src/assets/icons/icon-svg-files/dumbbell-concentration-2025-12-09-05.tsx",
    "src/assets/icons/icon-svg-files/hip-raise-dumbbell-2025-12-08T12-12-02.tsx",
    "src/assets/icons/icon-svg-files/cross-trainer-2025-12-08T12-07-46.tsx",
    "src/assets/icons/icon-svg-files/swinging-the-rope-2025-12-08T12-19-22.tsx",
    "src/assets/icons/icon-svg-files/seated-hip-adduction-2025-12-08T11-59-16.tsx",
    "src/assets/icons/icon-svg-files/bicep-dumbbell-tsx.tsx"
]

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r') as f:
        content = f.read()

    # Replace <clipPath with <ClipPath
    new_content = content.replace('<clipPath', '<ClipPath')
    # Replace </clipPath> with </ClipPath>
    new_content = new_content.replace('</clipPath>', '</ClipPath>')
    
    # Replace import { ..., clipPath, ... } with { ..., ClipPath, ... }
    # This is a bit more complex because of potential whitespace, but a simple replace might work if it's exact.
    # Or we can use regex to find clipPath in the import list.
    
    # Regex to replace clipPath with ClipPath in import statement
    # import ... from 'react-native-svg'
    
    # Simple string replace for the import might be safer if we assume standard formatting
    new_content = new_content.replace('clipPath,', 'ClipPath,')
    new_content = new_content.replace(', clipPath', ', ClipPath')
    new_content = new_content.replace('clipPath }', 'ClipPath }')
    
    # Also check if ClipPath is already imported to avoid duplicates if we just replaced it?
    # If the file had `import { clipPath }`, it becomes `import { ClipPath }`.
    # If it had `import { ClipPath, clipPath }` (unlikely), it becomes `import { ClipPath, ClipPath }`.
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed: {filepath}")
    else:
        print(f"No changes needed for: {filepath}")

for filepath in files_to_fix:
    fix_file(filepath)
