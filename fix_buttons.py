import re
import glob

files = glob.glob("client/src/components/SGSST/*.tsx")

pattern = re.compile(r'(<div className="[^"]*(?:flex-wrap items-center justify-between|sm:flex-nowrap|flex-row|justify-between)[^"]*gap[^"]*")')

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the main header div that uses flex and justify-between for the controls
    # We can be safe by looking for:
    # `    <div className="flex flex-wrap items-center justify-between...`
    # and converting it to:
    # `    <div className="flex flex-col gap-4 p-4...`
    
    # We will just replace ALL occurrences of `flex-wrap items-center justify-between` 
    # and `flex-wrap sm:flex-nowrap items-center justify-between`
    # with `flex-col items-start` as long as it's the toolbar.
    
    new_content = re.sub(
        r'className="flex flex-wrap items-center justify-between',
        r'className="flex flex-col items-start justify-center', 
        content
    )
    
    new_content = re.sub(
        r'className="flex flex-wrap sm:flex-nowrap items-center justify-between',
        r'className="flex flex-col items-start justify-center', 
        new_content
    )
    
    # Let's also ensure button row is flex-wrap
    if new_content != content:
        # Check if the right-side button group has flex-wrap:
        # usually `<div className="flex items-center gap-2">` or `<div className="flex items-center gap-3">`
        # We replace `className="flex items-center gap-2"` with `className="flex flex-wrap items-center gap-2"` if it's not and has buttons
        new_content = new_content.replace('className="flex items-center gap-2"', 'className="flex flex-wrap items-center gap-2 w-full"')
        new_content = new_content.replace('className="flex items-center gap-3"', 'className="flex flex-wrap items-center gap-3 w-full"')
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Patched header in {path}")
