import { memo } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

function HelpText({ endpoint }: { endpoint: string }) {
  const localize = useLocalize();
  const textMap = {
    [EModelEndpoint.google]: (
      <>
        <small className="break-all text-text-secondary">
          {localize('com_endpoint_config_google_api_key')}
          {': '}
          {localize('com_endpoint_config_google_api_info')}{' '}
          <a
            target="_blank"
            href="https://makersuite.google.com/app/apikey"
            rel="noreferrer"
            className="text-blue-700 underline dark:text-blue-400"
          >
            {localize('com_endpoint_config_click_here')}
          </a>{' '}
        </small>
      </>
    ),
  };

  return textMap[endpoint] || null;
}

export default memo(HelpText);
