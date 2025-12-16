import openpyxl

filename = '2026  agenda.xlsm'
sheet_name = 'Enero 2026'

try:
    wb = openpyxl.load_workbook(filename) # Default is data_only=False (shows formulas)
    ws = wb[sheet_name]
    
    print("Inspecting Row 1 formulas/values:")
    for col in range(1, 20):
        cell = ws.cell(row=1, column=col)
        print(f"{cell.coordinate}: {cell.value} (Type: {cell.data_type})")

except Exception as e:
    print(f"Error: {e}")
