import { forwardRef } from 'react';
import { Input, Label } from '@librechat/client';
import type { ChangeEvent, FC, Ref } from 'react';
import { cn, defaultTextPropsLabel, removeFocusOutlines, defaultTextProps } from '~/utils/';
import { useLocalize } from '~/hooks';

interface InputWithLabelProps {
  id: string;
  value: string;
  label: string;
  subLabel?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  labelClassName?: string;
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

const InputWithLabel: FC<InputWithLabelProps> = forwardRef((props, ref) => {
  const { id, value, label, subLabel, onChange, labelClassName = '', inputClassName = '' } = props;
  const localize = useLocalize();
  return (
    <div className="mt-3">
      <div className={cn('flex items-center justify-between mb-1.5', labelClassName)}>
        <Label htmlFor={id} className="text-left text-xs font-bold text-slate-700 dark:text-zinc-200">
          {label}
        </Label>
        {subLabel && <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">{subLabel}</span>}
      </div>
      <Input
        id={id}
        data-testid={`input-${id}`}
        value={value ?? ''}
        onChange={onChange}
        ref={ref}
        placeholder={`${localize('com_endpoint_config_value')} ${label}`}
        className={cn(
          'flex h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all shadow-2xs',
          inputClassName,
        )}
      />
    </div>
  );
});

export default InputWithLabel;
