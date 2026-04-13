import os
import re

dir_path = 'client/src/components/SGSST'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "<CollapsibleReportBox" not in content:
        return False
        
    filename = os.path.basename(filepath)
    
    # 1. Ensure ExportDropdown is imported
    if "ExportDropdown" not in content and "import" in content:
        # insert it after the last import
        imports = re.findall(r'^import .*?;$', content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(last_import, last_import + "\nimport ExportDropdown from './ExportDropdown';")
        else:
            content = "import ExportDropdown from './ExportDropdown';\n" + content

    # 2. Extract content variables for ExportDropdown
    # We want: editorContent || SOME_VAR || ''
    # Let's find what state variable holds generated output. Common: generatedReport, analysisReport, generatedMatrix, etc.
    report_var = "generatedReport"
    if "generatedObjectives" in content: report_var = "generatedObjectives"
    elif "analysisReport" in content: report_var = "analysisReport"
    elif "generatedMatrix" in content: report_var = "generatedMatrix"
    elif "generatedPolicy" in content: report_var = "generatedPolicy"
    
    # Clean export file name based on component
    export_name = "Informe_" + filename.replace('.tsx', '')
    
    new_actions = f"""actions={{
                        <ExportDropdown
                            content={{editorContent || {report_var} || ''}}
                            fileName="{export_name}"
                            reportType="general"
                        />
                    }}"""
    
    # Check if `actions={` already exists inside CollapsibleReportBox
    # Find the start of CollapsibleReportBox
    box_idx = content.find("<CollapsibleReportBox")
    end_box_idx = content.find(">", box_idx)
    
    actions_idx = content.find("actions={", box_idx)
    
    if actions_idx != -1 and actions_idx < end_box_idx + 1000: # It's within the box props
        # Find closing brace of actions
        open_braces = 0
        end_actions_idx = -1
        for i in range(actions_idx + 8, len(content)):
            if content[i] == '{':
                open_braces += 1
            elif content[i] == '}':
                open_braces -= 1
                if open_braces == 0:
                    end_actions_idx = i + 1
                    break
                    
        if end_actions_idx != -1:
            content = content[:actions_idx] + new_actions + content[end_actions_idx:]
    else:
        # actions=... does not exist, insert it before ">"
        # Be careful, CollapsibleReportBox might span multiple lines
        # find the end of the opening tag
        tag_end = content.find(">", box_idx)
        if tag_end != -1:
            content = content[:tag_end] + "\n                    " + new_actions + "\n                " + content[tag_end:]

    with open(filepath, 'w') as f:
        f.write(content)
        
    return True

for filename in os.listdir(dir_path):
    if filename.endswith('.tsx'):
        filepath = os.path.join(dir_path, filename)
        if process_file(filepath):
            print(f"Updated {filename}")

