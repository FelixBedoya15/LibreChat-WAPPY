import { ComponentTypes } from 'librechat-data-provider';
import type { DynamicSettingProps } from 'librechat-data-provider';
import {
  DynamicCombobox,
  DynamicDropdown,
  DynamicCheckbox,
  DynamicTextarea,
  DynamicSlider,
  DynamicSwitch,
  DynamicInput,
  DynamicTags,
} from './';

export const componentMapping: Record<
  ComponentTypes,
  React.ComponentType<DynamicSettingProps> | undefined
> = {
  [ComponentTypes?.Slider ?? 'slider']: DynamicSlider,
  [ComponentTypes?.Dropdown ?? 'dropdown']: DynamicDropdown,
  [ComponentTypes?.Switch ?? 'switch']: DynamicSwitch,
  [ComponentTypes?.Textarea ?? 'textarea']: DynamicTextarea,
  [ComponentTypes?.Input ?? 'input']: DynamicInput,
  [ComponentTypes?.Checkbox ?? 'checkbox']: DynamicCheckbox,
  [ComponentTypes?.Tags ?? 'tags']: DynamicTags,
  [ComponentTypes?.Combobox ?? 'combobox']: DynamicCombobox,
};
