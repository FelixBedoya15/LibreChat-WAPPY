import React, { useState, useEffect } from 'react';
import { Search, X, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import type { AgentForm } from '~/common';
import { useLocalize, useAuthContext } from '~/hooks';
import axios from 'axios';

interface Skill {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  scope?: string;
  content?: string;
}

export default function SkillSelectDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  const { getValues, setValue } = useFormContext<AgentForm>();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Administrative Edit/Create state
  const [isEditing, setIsEditing] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScope, setFormScope] = useState('all');
  const [formTriggers, setFormTriggers] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch available skills from backend
  const fetchSkills = () => {
    setLoading(true);
    axios.get<Skill[]>('/api/agents/skills')
      .then((res) => {
        setSkills(res.data || []);
      })
      .catch((err) => {
        console.error('Error fetching skills:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen]);

  const currentSkills: string[] = getValues('skills') || [];

  const handleToggleSkill = (skillId: string) => {
    let updatedSkills: string[];
    if (currentSkills.includes(skillId)) {
      updatedSkills = currentSkills.filter((id) => id !== skillId);
    } else {
      updatedSkills = [...currentSkills, skillId];
    }
    setValue('skills', updatedSkills, { shouldDirty: true });
  };

  const handleCreateNew = () => {
    setEditingSkill(null);
    setFormName('');
    setFormDescription('');
    setFormScope('all');
    setFormTriggers('');
    setFormContent('');
    setFormError('');
    setIsEditing(true);
  };

  const handleEditSkill = (skillId: string) => {
    setLoading(true);
    axios.get<Skill>(`/api/agents/skills/${skillId}`)
      .then((res) => {
        const fullSkill = res.data;
        setEditingSkill(fullSkill);
        setFormName(fullSkill.name);
        setFormDescription(fullSkill.description);
        setFormScope(fullSkill.scope || 'all');
        setFormTriggers(fullSkill.triggers ? fullSkill.triggers.join(', ') : '');
        setFormContent(fullSkill.content || '');
        setFormError('');
        setIsEditing(true);
      })
      .catch((err) => {
        console.error('Error fetching skill details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteSkill = (skillId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta habilidad? Esta acción no se puede deshacer.')) {
      return;
    }
    setLoading(true);
    axios.delete(`/api/agents/skills/${skillId}`)
      .then(() => {
        fetchSkills();
      })
      .catch((err) => {
        console.error('Error deleting skill:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    
    const triggersArray = formTriggers
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
      
    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      scope: formScope,
      triggers: triggersArray,
      content: formContent,
    };
    
    setLoading(true);
    const request = editingSkill 
      ? axios.put(`/api/agents/skills/${editingSkill.id}`, payload)
      : axios.post('/api/agents/skills', payload);
      
    request
      .then(() => {
        setIsEditing(false);
        fetchSkills();
      })
      .catch((err) => {
        console.error('Error saving skill:', err);
        setFormError(err.response?.data?.error || 'Error al guardar la habilidad');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
        setSearchValue('');
        setIsEditing(false);
      }}
      className="relative z-[102]"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-surface-primary opacity-60 transition-opacity dark:opacity-80" />

      {/* Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="relative max-h-[90vh] w-full transform overflow-hidden overflow-y-auto rounded-lg bg-surface-secondary text-left shadow-xl transition-all max-sm:h-full sm:mx-7 sm:my-8 sm:max-w-2xl lg:max-w-4xl"
          style={{ minHeight: '450px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-[1px] border-border-medium px-4 pb-4 pt-5 sm:p-6">
            <div>
              <DialogTitle className="text-lg font-medium leading-6 text-text-primary flex items-center gap-2">
                {isEditing ? (editingSkill ? 'Editar Skill' : 'Crear nuevo Skill') : 'Skills del agente'}
                {isAdmin && !isEditing && (
                  <button
                    onClick={handleCreateNew}
                    className="ml-2 py-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1"
                    type="button"
                  >
                    <Plus className="h-3 w-3" /> Crear Skill
                  </button>
                )}
              </DialogTitle>
              <Description className="text-sm text-text-secondary">
                {isEditing 
                  ? 'Completa los campos del skill y guarda los cambios en el archivo markdown.'
                  : 'Habilita habilidades específicas de consultoría que se activarán automáticamente mediante palabras clave.'
                }
              </Description>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  setIsOpen(false);
                }
              }}
              className="rounded-full text-text-secondary transition-colors hover:text-text-primary"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isEditing ? (
            /* Admin Create/Edit Form */
            <form onSubmit={handleSaveSkill} className="p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded-md">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                    ID / Nombre del Archivo
                  </label>
                  <input
                    type="text"
                    disabled={!!editingSkill}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. reglamento-interno-de-trabajo"
                    className="w-full rounded-md border border-border-light bg-surface-primary py-2 px-3 text-sm focus:border-border-medium focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Ámbito (Scope)
                  </label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                    className="w-full rounded-md border border-border-light bg-surface-primary py-2 px-3 text-sm focus:border-border-medium focus:outline-none"
                  >
                    <option value="all">Todos (all)</option>
                    <option value="agents">Chat / Agentes (agents)</option>
                    <option value="tenshi">Tenshi Widget (tenshi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Una breve descripción sobre qué hace este skill..."
                  className="w-full rounded-md border border-border-light bg-surface-primary py-2 px-3 text-sm focus:border-border-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Palabras Clave / Triggers (Separadas por comas)
                </label>
                <input
                  type="text"
                  value={formTriggers}
                  onChange={(e) => setFormTriggers(e.target.value)}
                  placeholder="reglamento interno, despidos, acoso laboral"
                  className="w-full rounded-md border border-border-light bg-surface-primary py-2 px-3 text-sm focus:border-border-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Instrucciones de la Habilidad (Markdown)
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="# Instrucciones del Skill..."
                  rows={8}
                  className="w-full rounded-md border border-border-light bg-surface-primary py-2 px-3 text-sm font-mono focus:border-border-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded border border-border-medium text-text-primary hover:bg-surface-tertiary text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Skill'}
                </button>
              </div>
            </form>
          ) : (
            /* Skills List View */
            <>
              {/* Search bar */}
              <div className="px-4 py-3 sm:px-6">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar skills..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full rounded-md border border-border-light bg-surface-primary py-2 pl-9 pr-4 text-sm focus:border-border-medium focus:outline-none focus:ring-1 focus:ring-ring-primary"
                  />
                </div>
              </div>

              {/* Main content grid */}
              <div className="px-4 pb-6 pt-2 sm:px-6">
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <span className="text-sm text-text-secondary animate-pulse">Cargando skills disponibles...</span>
                  </div>
                ) : filteredSkills.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center border border-dashed border-border-medium rounded-lg">
                    <span className="text-sm text-text-secondary">No se encontraron skills.</span>
                    <span className="text-xs text-text-tertiary mt-1">Utiliza el botón superior para crear un nuevo skill.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredSkills.map((skill) => {
                      const isAdded = currentSkills.includes(skill.id);
                      return (
                        <div
                          key={skill.id}
                          className={`flex flex-col justify-between border rounded-lg p-4 transition-all duration-200 bg-surface-primary hover:shadow-md ${
                            isAdded ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border-light'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                                <span className="text-emerald-500 font-bold">⚡</span>
                                {skill.name}
                              </span>
                              
                              {/* Administrative actions */}
                              {isAdmin && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditSkill(skill.id)}
                                    title="Editar"
                                    className="p-1 rounded text-text-secondary hover:text-emerald-500 hover:bg-surface-tertiary transition-colors"
                                    type="button"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    title="Eliminar"
                                    className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-surface-tertiary transition-colors"
                                    type="button"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {skill.description && (
                              <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                                {skill.description}
                              </p>
                            )}
                            {skill.triggers && skill.triggers.length > 0 && (
                              <div className="mb-4">
                                <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold block mb-1">
                                  Palabras clave (triggers):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {skill.triggers.map((trigger, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-text-secondary border border-border-light font-medium"
                                    >
                                      {trigger}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleToggleSkill(skill.id)}
                            className={`w-full py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                              isAdded
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <X className="h-3.5 w-3.5" />
                                Eliminar
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Agregar
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
