<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title: string;
    description?: string;
    children?: Snippet;
    footer?: Snippet;
  }

  let { open = $bindable(false), title, description = '', children, footer }: Props = $props();

  let element: HTMLDialogElement | null = $state(null);
  let titleId = `dialog-title-${Math.random().toString(36).slice(2, 9)}`;

  $effect(() => {
    if (element === null) return;

    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  });

  function close(): void {
    open = false;
  }

  function onBackdrop(event: MouseEvent): void {
    if (event.target === element) close();
  }
</script>

<dialog
  bind:this={element}
  aria-labelledby={titleId}
  onclose={close}
  oncancel={(event) => {
    event.preventDefault();
    close();
  }}
  onclick={onBackdrop}
  class="m-auto w-[min(30rem,calc(100vw-1.5rem))] rounded-[var(--radius-card)] border-0 bg-surface p-0 text-ink backdrop:bg-ink/60"
>
  <div class="p-5">
    <h2 id={titleId} class="text-lg font-bold">{title}</h2>
    {#if description !== ''}
      <p class="mt-1 text-sm text-muted">{description}</p>
    {/if}

    {#if children}
      <div class="mt-4">{@render children()}</div>
    {/if}

    {#if footer}
      <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{@render footer()}</div>
    {/if}
  </div>
</dialog>
