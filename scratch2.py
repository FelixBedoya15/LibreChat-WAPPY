import re

file_path = "client/src/components/SGSST/PublicPerfilUpdate.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add to WorkerData
content = content.replace(
    "id: string; nombre: string; cargo: string; identificacion: string;",
    "id: string; nombre: string; cargo: string; identificacion: string;\n    edad: string; genero: string; estadoCivil: string; nivelEscolaridad: string; direccion: string;"
)

# 2. Add to setFormData
content = content.replace(
    "id: w.id, // Store real ID",
    "id: w.id, // Store real ID\n                edad: w.edad, genero: w.genero, estadoCivil: w.estadoCivil, nivelEscolaridad: w.nivelEscolaridad, direccion: w.direccion,"
)

# 3. Add Habeas Data state
content = content.replace(
    "const [submitting, setSubmitting] = useState(false);",
    "const [submitting, setSubmitting] = useState(false);\n    const [habeasData, setHabeasData] = useState(false);"
)

# 4. Add UI Fields
general_ui_chunk = """
                            {/* Datos Básicos */}
                            <SectionTitle icon={User} label="Datos Básicos y Domicilio" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Edad (Ej: 35)">
                                    <Input type="number" value={formData.edad || ''} onChange={e => upd('edad', e.target.value)} />
                                </Field>
                                <Field label="Género">
                                    <SingleSelect value={formData.genero || ''} onChange={val => upd('genero', val)} placeholder="Seleccionar" options={['Masculino', 'Femenino', 'Otro']} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Estado Civil">
                                    <SingleSelect value={formData.estadoCivil || ''} onChange={val => upd('estadoCivil', val)} placeholder="Seleccionar" options={['Soltero/a', 'Casado/a', 'Unión Libre', 'Separado/a', 'Viudo/a']} />
                                </Field>
                                <Field label="Escolaridad">
                                    <SingleSelect value={formData.nivelEscolaridad || ''} onChange={val => upd('nivelEscolaridad', val)} placeholder="Seleccionar" options={['Ninguna', 'Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Profesional', 'Posgrado']} />
                                </Field>
                            </div>
                            <Field label="Dirección de Domicilio">
                                <Input value={formData.direccion || ''} onChange={e => upd('direccion', e.target.value)} placeholder="Ej: Calle Principal 123, Ciudad" />
                            </Field>

                            {/* Contacto y Emergencia */}
                            <SectionTitle icon={Phone} label="Contacto y Emergencia" />"""

content = content.replace(
    "{/* General */}\n                            <SectionTitle icon={User} label=\"Contacto y Emergencia\" />",
    general_ui_chunk
)
# If previous replace fails due to different layout, let's try a more robust regular expression or string match
if general_ui_chunk not in content:
    content = content.replace(
        '<SectionTitle icon={User} label="Contacto y Emergencia" />',
        general_ui_chunk.replace("{/* General */}\n                            ", "").replace("icon={Phone}", "icon={Phone}")
    )

# 5. Add Habeas Data Checkbox & Submit disabled condition
habeas_chunk = """
                        <div className="mt-8 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                                    <input type="checkbox" checked={habeasData} onChange={e => setHabeasData(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 bg-white checked:border-teal-600 checked:bg-teal-600 transition-all" />
                                    <Shield className="absolute pointer-events-none w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[11px] text-gray-500 leading-relaxed font-medium">
                                    <strong className="text-gray-700 block mb-1">Aceptación de Tratamiento de Datos (Ley 1581 Habeas Data)</strong>
                                    Autorizo a la empresa el tratamiento de mis datos personales, sociodemográficos y médicos (sensibles) con fines exclusivos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) bajo la normativa colombiana vigente.
                                </div>
                            </label>
                        </div>

                        <button"""

content = content.replace(
    "<button\n                            onClick={handleSubmit}",
    habeas_chunk.strip() + "\n                            onClick={handleSubmit}"
)

# 6. Disable Submit Button
content = content.replace(
    "disabled={submitting}",
    "disabled={submitting || !habeasData}"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
