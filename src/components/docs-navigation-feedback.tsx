'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PENDING_ATTRIBUTE = 'data-docs-navigation-pending';
const PENDING_SELECTOR = `a[${PENDING_ATTRIBUTE}="true"]`;
const SIDEBAR_LINK_SELECTOR =
  '#nd-sidebar a[href], #nd-sidebar-mobile a[href]';
const PENDING_FALLBACK_TIMEOUT_MS = 8000;

function clearPendingLinks() {
  document.querySelectorAll(PENDING_SELECTOR).forEach((element) => {
    element.removeAttribute(PENDING_ATTRIBUTE);
    element.removeAttribute('aria-busy');
  });
}

function isModifiedNavigation(event: MouseEvent | PointerEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function getPendingLink(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const link = target.closest<HTMLAnchorElement>(SIDEBAR_LINK_SELECTOR);
  if (!link || link.target === '_blank' || link.hasAttribute('download')) {
    return null;
  }

  const currentUrl = new URL(window.location.href);
  const nextUrl = new URL(link.href, currentUrl);

  if (nextUrl.origin !== currentUrl.origin) return null;
  if (!nextUrl.pathname.includes('/docs')) return null;
  if (
    nextUrl.pathname === currentUrl.pathname &&
    nextUrl.search === currentUrl.search
  ) {
    return null;
  }

  return link;
}

export function DocsNavigationFeedback() {
  const pathname = usePathname();
  const clearTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (clearTimeoutRef.current !== null) {
      window.clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    clearPendingLinks();
  }, [pathname]);

  useEffect(() => {
    function markPending(event: MouseEvent | PointerEvent) {
      if (event.defaultPrevented) return;
      if ('button' in event && event.button !== 0) return;
      if (isModifiedNavigation(event)) return;

      const link = getPendingLink(event.target);
      if (!link) return;

      clearPendingLinks();
      link.setAttribute(PENDING_ATTRIBUTE, 'true');
      link.setAttribute('aria-busy', 'true');

      if (clearTimeoutRef.current !== null) {
        window.clearTimeout(clearTimeoutRef.current);
      }

      clearTimeoutRef.current = window.setTimeout(() => {
        clearPendingLinks();
        clearTimeoutRef.current = null;
      }, PENDING_FALLBACK_TIMEOUT_MS);
    }

    document.addEventListener('pointerdown', markPending, { capture: true });
    document.addEventListener('click', markPending, { capture: true });

    return () => {
      document.removeEventListener('pointerdown', markPending, {
        capture: true,
      });
      document.removeEventListener('click', markPending, { capture: true });

      if (clearTimeoutRef.current !== null) {
        window.clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return null;
}
