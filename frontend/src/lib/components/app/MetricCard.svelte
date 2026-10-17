<script lang="ts">
  interface Props {
    label: string;
    value: string;
    suffix?: string;
  }

  let { label, value, suffix = '' }: Props = $props();
</script>

<div class="card px-3 py-3 text-center">
  <p class="font-mono text-xl font-extrabold text-primary">
    {value}{#if suffix !== ''}<span class="text-xs font-bold text-muted"> {suffix}</span>{/if}
  </p>
  <p class="mt-0.5 text-[11px] font-medium text-muted">{label}</p>
</div>
