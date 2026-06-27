import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { i18n } from '@/lib/i18n';
import Image from 'next/image';
import { getLocalePath } from '@/lib/i18n';
import { getWebsiteName } from '@/lib/site-config';

const websiteName = getWebsiteName();

export const logo = (
  <Image
    alt={websiteName}
    src="/assets/auth_logo.png"
    width={40}
    height={40}
    className="size-10"
    priority
    unoptimized
  />
);

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      url: getLocalePath(locale, 'docs'),
      title: (
        <>
          {logo}
          <span className="font-medium in-[header]:text-[15px] [.uwu_&]:hidden">
            {websiteName}
          </span>
        </>
      ),
    },
  };
}
