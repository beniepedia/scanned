<script lang="ts">
  interface Props {
    active?: boolean;
  }

  let { active = true }: Props = $props();
</script>

<div class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
  <div class="relative h-[26%] w-[76%] max-w-md">
    <span class="absolute top-0 left-0 size-8 border-t-[3px] border-l-[3px] border-primary"></span>
    <span class="absolute top-0 right-0 size-8 border-t-[3px] border-r-[3px] border-primary"></span>
    <span class="absolute bottom-0 left-0 size-8 border-b-[3px] border-l-[3px] border-primary"></span>
    <span class="absolute right-0 bottom-0 size-8 border-r-[3px] border-b-[3px] border-primary"></span>

    {#if active}
      <span
        class="absolute inset-x-1 top-0 h-1 animate-[scanline_2.4s_ease-in-out_infinite] rounded-full bg-primary/50"
        style="--scan-height: 100%"
      ></span>
    {/if}
  </div>
</div>
