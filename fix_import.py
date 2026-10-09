with open('client/src/components/Chat/Input/AgentSessionPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken react-dom import
content = content.replace(
    "import {\n    Notebook as NotebookIcon, createPortal } from 'react-dom';",
    "import { createPortal } from 'react-dom';"
)

# Add Notebook to lucide-react import
content = content.replace(
    "Settings2, Globe, FolderSearch,",
    "Settings2, Globe, FolderSearch, Notebook as NotebookIcon,"
)

with open('client/src/components/Chat/Input/AgentSessionPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
