'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/dom/Toast';
import { cx } from '@/lib/utils';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API blocked (insecure context, permissions): legacy path.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export function CopyEmailButton({ email, className }: { email: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      data-cursor="COPY"
      aria-busy={busy}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const ok = await copyText(email);
        setBusy(false);
        toast(ok ? 'Copied' : `Copy failed. Email: ${email}`, ok ? 'success' : 'neutral');
      }}
      className={cx(
        'group inline-flex min-h-11 items-center gap-3 rounded-chip border border-border px-4 text-left',
        'transition-colors duration-[var(--duration-micro)] hover:border-signal hover:text-signal',
        className,
      )}
    >
      <span className="break-all">{email}</span>
      <Copy aria-hidden="true" strokeWidth={1.5} className="size-4 shrink-0" />
      <span className="sr-only">Copy email address</span>
    </button>
  );
}
