import re

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the schema
old_schema = '''            } else if (id === "permiso_alturas") {
                jsonSchema = {
                    "alturas-sistema": "Sistemas de acceso y protección anticaídas recomendados",
                    "newTasks": [
                        { "title": "Verificar curso de alturas vigente y aptitud médica" },
                        { "title": "Inspeccionar el 100% de arneses y eslingas de alturas" }
                    ]
                };
                sstInstructions = "Actúas como un coordinador e instructor experto en trabajo en alturas bajo Resolución 4272.";
            }'''

new_schema = '''            } else if (id === "permiso_alturas") {
                jsonSchema = {
                    "alturas-sistema": "Sistemas de acceso y protección anticaídas recomendados",
                    "alturas-peligro-caida-control": "Controles para riesgo de caída a diferente nivel",
                    "alturas-peligro-caida-gravedad": "Uno de los siguientes valores exactos: Leve, Grave, Muy Grave, Mortal",
                    "alturas-peligro-objetos-control": "Controles para caída de objetos",
                    "alturas-peligro-objetos-gravedad": "Uno de los siguientes valores exactos: Leve, Grave, Muy Grave, Mortal",
                    "alturas-peligro-electrico-control": "Controles para riesgo eléctrico",
                    "alturas-peligro-electrico-gravedad": "Uno de los siguientes valores exactos: Leve, Grave, Muy Grave, Mortal",
                    "alturas-peligro-colapso-control": "Controles para colapso de estructura/andamio",
                    "alturas-peligro-colapso-gravedad": "Uno de los siguientes valores exactos: Leve, Grave, Muy Grave, Mortal",
                    "alturas-peligro-suspension-control": "Controles para trauma por suspensión",
                    "alturas-peligro-suspension-gravedad": "Uno de los siguientes valores exactos: Leve, Grave, Muy Grave, Mortal",
                    "atsRows": [
                        { "paso": "1", "descripcion": "Inspección pre-operacional", "peligros": "Caída a nivel", "controles": "Uso de botas, orden y aseo" },
                        { "paso": "2", "descripcion": "Armado de andamio", "peligros": "Atrapamiento, caída de objetos", "controles": "Uso de guantes, delimitar área" }
                    ],
                    "newTasks": [
                        { "title": "Verificar curso de alturas vigente y aptitud médica" },
                        { "title": "Inspeccionar el 100% de arneses y eslingas de alturas" }
                    ]
                };
                sstInstructions = "Actúas como un coordinador e instructor experto en trabajo en alturas bajo Resolución 4272. Tu objetivo es generar paso a paso el ATS (Análisis de Trabajo Seguro) de la tarea y evaluar rigurosamente los peligros críticos de alturas.";
            }'''

content = content.replace(old_schema, new_schema)

# 2. Add the assignment block for atsRows
assignment_target = '''                if (aiResult.arbolCausasNodes && Array.isArray(aiResult.arbolCausasNodes)) {'''
new_assignment = '''                if (aiResult.atsRows && Array.isArray(aiResult.atsRows)) {
                    currentWizard.atsRows = aiResult.atsRows;
                    if (typeof renderATSTable === 'function') renderATSTable();
                }
                if (aiResult.arbolCausasNodes && Array.isArray(aiResult.arbolCausasNodes)) {'''

content = content.replace(assignment_target, new_assignment)

with open('/Users/venta/Documents/GitHub/LibreChat-WAPPY/SGSST_Formatos/permiso_alturas.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated schema and assignment logic.")
