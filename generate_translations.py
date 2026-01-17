import json
import re

common_english_words = [
    " the ", " and ", " to ", " of ", " for ", " in ", " with ", " on ", " at ", " by ", " from ", " about ", " as ", " if ",
    " please ", " error ", " success ", " failed ", " warning ", " cancel ", " save ", " delete ", " update ",
    " create ", " edit ", " view ", " copy ", " generating ", " uploaded ", " required ", " optional ",
    " instead ", " settings ", " setup ", " confirm ", " revoke ", " manage ", " download ", " upload ",
    " search ", " clear ", " reset ", " close ", " open ", " actions ", " tools ", " files ", " models ",
    " assistant ", " agent ", " message ", " conversation ", " prompt ", " submit ", " continue ", " back ",
    " next ", " previous ", " all ", " none ", " yes ", " no ", " ok ", " done ", " finished ", " completed "
]

def check_translations(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    issues = []
    for key, value in data.items():
        if not isinstance(value, str):
            continue
            
        lower_val = " " + value.lower() + " "
        
        # Check for empty or identical key-value
        if not value or key == value:
            issues.append(f"[KEY-MATCH/EMPTY] {key}: {value}")
            continue

        # Check for English words
        matches = [word.strip() for word in common_english_words if word in lower_val]
        if matches:
            issues.append(f"[ENGLISH-DETECTED] {key}: {value} (Matched: {matches})")

    return issues

if __name__ == "__main__":
    issues = check_translations('client/src/locales/es/translation.json')
    print(f"Found {len(issues)} potential issues:\n")
    for issue in issues[:100]: # Limit output
        print(issue)
