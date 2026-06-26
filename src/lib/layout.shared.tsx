import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { i18n } from '@/lib/i18n';
import Image from 'next/image';
import { getLocalePath } from '@/lib/i18n';

export const logo = (
  <Image
    alt="Lychee AI"
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
            Lychee AI
          </span>
        </>
      ),
    },
  };
}
