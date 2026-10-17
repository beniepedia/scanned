<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
    children: Snippet;
  }

  let { tone = 'neutral', children }: Props = $props();

  const tones: Record<string, string> = {
    success: 'bg-tertiary-soft text-tertiary-ink',
    danger: 'bg-danger-soft text-danger-ink',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-secondary-soft text-secondary',
    neutral: 'bg-bg text-muted',
  };
</script>

<span
  class={[
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
    tones[tone],
  ].join(' ')}
>
  {@render children()}
</span>
