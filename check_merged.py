import openpyxl

filename = '2026  agenda.xlsm'
sheet_name = 'Enero 2026'

try:
    wb = openpyxl.load_workbook(filename)
    ws = wb[sheet_name]
    
    print("Merged cells:")
    for range_ in ws.merged_cells.ranges:
        print(range_)

    print("\nChecking specific cells again (data_only=True):")
    wb_data = openpyxl.load_workbook(filename, data_only=True)
    ws_data = wb_data[sheet_name]
    print(f"B1: {ws_data['B1'].value}")
    print(f"E1: {ws_data['E1'].value}")

except Exception as e:
    print(f"Error: {e}")
