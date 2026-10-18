<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = 'h-4 w-full' }: Props = $props();
</script>

<div class={['animate-pulse rounded-md bg-line/60', className].join(' ')} aria-hidden="true"></div>
