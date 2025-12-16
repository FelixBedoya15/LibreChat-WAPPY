import openpyxl

filename = '2026  agenda.xlsm'
sheet_name = 'Enero 2026'

try:
    wb = openpyxl.load_workbook(filename)
    ws = wb[sheet_name]
    cell = ws['B1']
    print(f"B1 Value: {cell.value}")
    print(f"B1 Number Format: {cell.number_format}")

except Exception as e:
    print(f"Error: {e}")
