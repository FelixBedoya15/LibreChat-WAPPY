import { useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import useAuthSearchTool from '~/hooks/Plugins/useAuthSearchTool';
import type { SearchApiKeyFormData } from '~/hooks/Plugins/useAuthSearchTool';

export default function useSearchApiKeyForm({
  onSubmit,
  onRevoke,
}: {
  onSubmit?: () => void;
  onRevoke?: () => void;
}) {
  const methods = useForm<SearchApiKeyFormData>({
    defaultValues: (() => {
      try {
        const saved = localStorage.getItem('librechat_web_search_config');
        return saved ? JSON.parse(saved) : undefined;
      } catch (e) {
        return undefined;
      }
    })(),
  });
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const badgeTriggerRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { installTool, removeTool } = useAuthSearchTool({ isEntityTool: true });
  const { reset } = methods;

  const onSubmitHandler = useCallback(
    (data: SearchApiKeyFormData) => {
      installTool(data);
      localStorage.setItem('librechat_web_search_config', JSON.stringify(data));
      setIsDialogOpen(false);
      onSubmit?.();
    },
    [onSubmit, installTool],
  );

  const handleRevokeApiKey = useCallback(() => {
    reset();
    localStorage.removeItem('librechat_web_search_config');
    removeTool();
    setIsDialogOpen(false);
    onRevoke?.();
  }, [reset, onRevoke, removeTool]);

  return {
    methods,
    isDialogOpen,
    setIsDialogOpen,
    handleRevokeApiKey,
    onSubmit: onSubmitHandler,
    badgeTriggerRef,
    menuTriggerRef,
  };
}
