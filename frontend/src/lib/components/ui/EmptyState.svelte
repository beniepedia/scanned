<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    icon?: string;
  }

  let { title, description = '', icon = '📋' }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
  <span class="text-3xl" aria-hidden="true">{icon}</span>
  <p class="font-semibold text-ink">{title}</p>
  {#if description !== ''}
    <p class="max-w-xs text-sm text-muted">{description}</p>
  {/if}
</div>
