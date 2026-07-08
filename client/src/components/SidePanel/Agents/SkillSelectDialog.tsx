import React, { useState, useEffect } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import type { AgentForm } from '~/common';
import { useLocalize } from '~/hooks';
import axios from 'axios';

interface Skill {
  id: string;
  name: string;
  description: string;
  triggers: string[];
}

export default function SkillSelectDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const localize = useLocalize();
  const { getValues, setValue } = useFormContext<AgentForm>();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch available skills from backend
  useEffect(() => {
    if (isOpen) {
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
              <DialogTitle className="text-lg font-medium leading-6 text-text-primary">
                Skills del agente
              </DialogTitle>
              <Description className="text-sm text-text-secondary">
                Habilita habilidades específicas de consultoría que se activarán automáticamente mediante palabras clave.
              </Description>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full text-text-secondary transition-colors hover:text-text-primary"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
                <span className="text-xs text-text-tertiary mt-1">Crea archivos markdown en `api/config/skills/` para añadir más.</span>
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
        </DialogPanel>
      </div>
    </Dialog>
  );
}
