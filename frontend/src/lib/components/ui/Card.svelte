<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    padding?: 'none' | 'sm' | 'md';
    class?: string;
    children: Snippet;
  }

  let { padding = 'md', class: className = '', children }: Props = $props();

  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
  };

  let classes = $derived(['card', paddings[padding], className].filter(Boolean).join(' '));
</script>

<div class={classes}>
  {@render children()}
</div>
