import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Trash } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import type { AgentForm } from '~/common';
import { cn } from '~/utils';

export default function AgentSkill({
  skillId,
  skillName,
  skillDescription,
}: {
  skillId: string;
  skillName: string;
  skillDescription?: string;
}) {
  const { showToast } = useToastContext();
  const { getValues, setValue } = useFormContext<AgentForm>();

  const removeSkill = () => {
    const remainingSkills = getValues('skills')?.filter((id: string) => id !== skillId) || [];
    setValue('skills', remainingSkills, { shouldDirty: true });
    showToast({ message: 'Skill eliminado con éxito', status: 'success' });
  };

  return (
    <div
      className="group relative flex w-full items-center gap-1 rounded-lg p-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
    >
      <div className="flex grow items-center">
        {/* Simple modern icon badge for skill */}
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
          ⚡
        </div>
        <div
          className="grow px-2 py-1.5 font-medium"
          style={{ textOverflow: 'ellipsis', wordBreak: 'break-all', overflow: 'hidden' }}
        >
          {skillName}
          {skillDescription && (
            <span className="block text-xs text-text-secondary font-normal">{skillDescription}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={removeSkill}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded transition-all duration-200',
          'hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500',
        )}
        title="Eliminar skill"
      >
        <Trash className="h-4 w-4" />
      </button>
    </div>
  );
}
