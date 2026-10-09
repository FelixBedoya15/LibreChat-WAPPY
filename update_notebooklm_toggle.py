import re

with open('client/src/components/Chat/Input/AgentSessionPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the filtering logic to separate notebooklm tools
original_filter = "const generalExternalTools = externalTools.filter(id => !googleToolIds.includes(id));"
new_filter = """    const allGeneralExternalTools = externalTools.filter(id => !googleToolIds.includes(id));
    const notebookLmTools = allGeneralExternalTools.filter(id => id.includes('_mcp_notebooklm'));
    const generalExternalTools = allGeneralExternalTools.filter(id => !id.includes('_mcp_notebooklm'));
    
    const isNotebookLmActive = notebookLmTools.length > 0 && notebookLmTools.some(id => (overrides as TEphemeralAgentExtended | null)?.tools?.includes(id));
    
    const toggleNotebookLm = () => {
        notebookLmTools.forEach(toolId => {
            const isActive = (overrides as TEphemeralAgentExtended | null)?.tools?.includes(toolId);
            if (isNotebookLmActive && isActive) {
                toggleExternalTool(toolId);
            } else if (!isNotebookLmActive && !isActive) {
                toggleExternalTool(toolId);
            }
        });
    };
"""

content = content.replace(original_filter, new_filter)

# 2. Add NotebookLM icon import (Notebook from lucide-react)
if 'NotebookIcon' not in content:
    content = re.sub(r"import \{", "import {\n    Notebook as NotebookIcon,", content, count=1)

# 3. Add NotebookLM single button render right before generalExternalTools.map
general_map = "{generalExternalTools.map((toolId) => {"
notebook_ui = """                                {notebookLmTools.length > 0 && (
                                    <Ariakit.MenuItem
                                        hideOnClick={false}
                                        render={
                                            <ToolRow
                                                id="agent-session-notebooklm"
                                                icon={<NotebookIcon className="h-4 w-4 text-emerald-600" />}
                                                label="Google NotebookLM (MCP)"
                                                checked={isNotebookLmActive}
                                                onChange={toggleNotebookLm}
                                            />
                                        }
                                    />
                                )}
                                {generalExternalTools.map((toolId) => {"""

content = content.replace(general_map, notebook_ui)

with open('client/src/components/Chat/Input/AgentSessionPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
