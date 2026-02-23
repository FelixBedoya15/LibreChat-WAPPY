import { useLocalize } from '~/hooks';
import { TStartupConfig } from 'librechat-data-provider';

function Footer({ startupConfig }: { startupConfig: TStartupConfig | null | undefined }) {
  const localize = useLocalize();
  if (!startupConfig) {
    return null;
  }

  return (
    <div className="align-end m-4 flex justify-center gap-2" role="contentinfo">
      <a
        className="text-sm text-green-500"
        href="/privacy"
      >
        {localize('com_ui_privacy_policy')}
      </a>
      <div className="border-r-[1px] border-gray-300 dark:border-gray-600" />
      <a
        className="text-sm text-green-500"
        href="/terms"
      >
        {localize('com_ui_terms_of_service')}
      </a>
    </div>
  );
}

export default Footer;

