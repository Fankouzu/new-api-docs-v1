import { getWebsiteName } from '@/lib/site-config';

export function WebsiteName() {
  return <>{getWebsiteName()}</>;
}
