import re

fname = 'client/src/components/SGSST/DiagnosticoChecklist.tsx'
with open(fname, 'r') as f:
    content = f.read()

# I want to extract the button group:
button_group_pattern = re.compile(r'(<div className="flex flex-wrap items-center gap-2">\s*<DummyGenerateButton onClick=\{handleDummyData\} \/>[\s\S]*?(?:<\/div>\s*){2}<!-- Progress bar -->)', re.DOTALL)

# Wait, the structure is:
#                     <div className="flex flex-wrap items-center gap-2">
#                     <DummyGenerateButton onClick={handleDummyData} />
#                       ...
#                     </div>
#                 </div>  <-- Closes flex flex-col md:flex-row
#                 {/* Progress bar */}

button_group_match = re.search(r'(\s*<div className="flex flex-wrap items-center gap-2">\s*<DummyGenerateButton onClick=\{handleDummyData\} \/>[\s\S]*?)(\s*<\/div>\s*<\/div>\s*\{\/\* Progress bar \*\/\})', content)
if not button_group_match:
    print("Cannot find button group")
    exit(1)

buttons_html = button_group_match.group(1).strip()
# Change the class to match Auditoria but without replacing everything inside
buttons_html = buttons_html.replace('className="flex flex-wrap items-center gap-2"', 'className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border-light pt-4"')

# Remove from original location
content = content.replace(button_group_match.group(1), "")

# Now find where to put it (after Progress bar)
progress_bar_end_pattern = r'(\{\/\* Progress bar \*\/\}[\s\S]*?style=\{\{ width: `\$\{\(currentScore \/ totalPoints\) \* 100\}%` \}\}\s*\/>\s*<\/div>)'
progress_match = re.search(progress_bar_end_pattern, content)

if progress_match:
    content = content.replace(progress_match.group(1), progress_match.group(1) + "\n                " + buttons_html)
else:
    print("Cannot find progress bar end")
    exit(1)

with open(fname, 'w') as f:
    f.write(content)
print("Done")
