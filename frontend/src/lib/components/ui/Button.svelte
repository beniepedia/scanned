<script lang="ts">
  import type { Snippet } from 'svelte';
  import Spinner from './Spinner.svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'md' | 'lg';
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    full?: boolean;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    full = false,
    onclick,
    children,
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-card)] font-bold transition-[background-color,transform] duration-150 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

  const sizes: Record<string, string> = {
    md: 'min-h-12 px-5 text-[15px]',
    lg: 'min-h-14 px-6 text-base',
  };

  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'border-[1.5px] border-line bg-surface text-ink hover:border-muted/50',
    ghost: 'text-muted hover:bg-black/5',
    danger: 'bg-danger text-white hover:bg-danger-ink',
  };

  let classes = $derived(
    [base, sizes[size], variants[variant], full ? 'w-full' : ''].filter(Boolean).join(' ')
  );
</script>

<button {type} {disabled} {onclick} class={classes} aria-busy={loading}>
  {#if loading}
    <Spinner class="size-4" />
  {/if}
  {@render children()}
</button>
