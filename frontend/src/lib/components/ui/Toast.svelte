<script lang="ts">
  import { toasts, dismissToast } from '$lib/stores/toast.svelte';

  const tones: Record<string, string> = {
    success: 'border-tertiary/40 bg-tertiary-soft text-tertiary-ink',
    error: 'border-danger/40 bg-danger-soft text-danger-ink',
    info: 'border-line bg-surface text-ink',
  };
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
  aria-live="polite"
  role="status"
>
  {#each toasts as toast (toast.id)}
    <div
      class={[
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-card)] border-[1.5px] px-4 py-3 text-sm font-medium shadow-lg',
        tones[toast.kind],
      ].join(' ')}
    >
      <p class="flex-1">{toast.message}</p>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-lg opacity-70 hover:opacity-100"
        aria-label="Tutup notifikasi"
        onclick={() => dismissToast(toast.id)}>✕</button
      >
    </div>
  {/each}
</div>
