import re
import glob
import os

files = glob.glob("client/src/components/SGSST/*.tsx")

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if "useAutoLoadReport({" not in content:
        continue

    # Extract the block
    # It looks like:
    #     useAutoLoadReport({
    #         token,
    #         tags: ['something'],
    #         generatedReport,
    #         handleSelectReport
    #     });
    
    # Let's match it using regex
    pattern = r"\s*useAutoLoadReport\(\{\s*token,\s*tags: \['[^']+'\],\s*generated[A-Za-z]+,\s*handleSelectReport\s*\}\);"
    match = re.search(pattern, content)
    
    if not match:
        # maybe it has different spacing or naming?
        pattern_fallback = r"\s*useAutoLoadReport\(\{[^\}]+\}\);"
        match = re.search(pattern_fallback, content)
        if not match:
            print(f"Could not find useAutoLoadReport block in {path}")
            continue

    block = match.group(0)
    tag_match = re.search(r"tags:\s*\['([^']+)'\]", block)
    if not tag_match:
        print(f"No tag found in {path}")
        continue
        
    tag = tag_match.group(1)
    
    # We must determine if this component uses `generatedReport` or `generatedObjectives` or `generatedSomething`
    # Let's see what the original block had.
    gen_var = "generatedReport"
    gen_match = re.search(r"generated[A-Za-z]+", block)
    if gen_match:
        # Avoid matching 'generatedReport,' if the text was something else, but actually
        # the component uses a state variable. Let's find out what the component uses by searching for `const \[([^,]+), setGenerated`
        
        state_match = re.search(r"const\s*\[([a-zA-Z]+),\s*setGenerated", content)
        if state_match:
            gen_var = state_match.group(1)
        else:
            gen_var = gen_match.group(0)
    
    # Remove the block from its current bad location
    content = content.replace(block, "")
    
    # Locate the best place to insert it in the Main Component
    # Best place is typically after all `const [...] = useState(...);`
    # Let's find `const handleSelectReport = `
    handle_select_match = re.search(r"const handleSelectReport\s*=\s*", content)
    if not handle_select_match:
        print(f"Cannot find handleSelectReport in {path}")
        continue
    
    hook_code = f"\n    useAutoLoadReport({{\n        token,\n        tags: ['{tag}'],\n        generatedReport: {gen_var},\n        handleSelectReport\n    }});\n"
    
    # Insert it right before the first return in the main component. 
    # Or even better, right before `return (` that is at the outer indentation.
    # regex to find the main return: `\n    return \(\n` or `\n    return (\n`
    # Wait, in the main component, the outermost return usually has exactly 4 spaces.
    main_return_match = re.search(r"\n    return \(\n|\n    return \n", content)
    if main_return_match:
        content = content.replace(main_return_match.group(0), hook_code + main_return_match.group(0), 1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {path}")
    else:
        # fallback: insert it right before `// ─── Render`
        render_match = re.search(r"// ─── Render", content, re.IGNORECASE)
        if render_match:
            content = content.replace(render_match.group(0), hook_code + "\n    " + render_match.group(0), 1)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Fixed (render match) {path}")
        else:
            print(f"Could not find main return or Render comment in {path}")
