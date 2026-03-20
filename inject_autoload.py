import re
import os
import glob

components_dir = "client/src/components/SGSST"
files = glob.glob(f"{components_dir}/*.tsx")

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip files that don't have ReportHistory or already have useAutoLoadReport
    if "ReportHistory" not in content or "useAutoLoadReport" in content:
        continue

    # Find the tags for ReportHistory
    tags_match = re.search(r"<ReportHistory[^>]+tags=\{\['([^']+)'\]\}", content)
    if not tags_match:
        # Maybe tags are passed without curly braces? Or multiline?
        tags_match = re.search(r"tags=\{\['([^']+)'\]\}", content)
        if not tags_match:
            print(f"No tag found in {file_path}")
            continue
    
    tag = tags_match.group(1)

    # We need to inject the import
    import_statement = "import { useAutoLoadReport } from './useAutoLoadReport';\n"
    # Find the last import
    last_import_index = content.rfind("import ")
    if last_import_index != -1:
        end_of_last_import = content.find("\n", last_import_index)
        content = content[:end_of_last_import+1] + import_statement + content[end_of_last_import+1:]
    else:
        content = import_statement + content

    # Find the handleSelectReport function and the start of the component body
    # Usually it's `const handleSelectReport = ` or similar.
    # What we actually need is `token`, `generatedReport`, `handleSelectReport` inside the component body,
    # before `return (`.
    
    # We will just inject the hook call before `return (` which is somewhat safe, 
    # but we need it inside the component. Best place is right before the FIRST `return (` .
    
    # Wait, some components might have early returns. Let's find `const { token } = useAuthContext();` or similar
    # or just right after `const handleSelectReport = ...;`
    hook_call = f"""
    useAutoLoadReport({{
        token,
        tags: ['{tag}'],
        generatedReport,
        handleSelectReport
    }});
"""
    # Let's insert it after handleSelectReport definition ends, or before `return (` 
    
    # Search for exactly this line `const handleSelectReport = ` or `const handleSelectReport = async`
    handle_select_match = re.search(r"const handleSelectReport = ", content)
    if handle_select_match:
        # find the end of handleSelectReport logic. Since we don't know where it ends exactly,
        # finding `return (` might be easier, but we need to find the MAIN return, not inside some map.
        # Better: let's find `const [isHistoryOpen, setIsHistoryOpen] = useState(false);` 
        # But maybe we just inject it exactly string replacement:
        
        # Another option: insert right above `return (` but we must match the outer return.
        # Usually it's `    return (` or `  return (`
        
        # A simpler way: we know they have const handleSelectReport. We can inject it right before `return (`.
        match_return = re.search(r"\n\s+return \(\n", content)
        if match_return:
            content = content.replace(match_return.group(0), "\n" + hook_call + match_return.group(0), 1)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Patched {file_path} with tag {tag}")
        else:
            print(f"No main return found in {file_path}")
    else:
        print(f"No handleSelectReport found in {file_path}")
