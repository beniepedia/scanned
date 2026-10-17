<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = 'size-5' }: Props = $props();
</script>

<svg class="{className} animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
</svg>
