<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import { SPBU } from '$lib/data/seed';
  import type { Operator } from '$lib/types';

  interface Props {
    operator: Operator;
  }

  let { operator }: Props = $props();

  let initial = $derived(operator.nama.charAt(0).toUpperCase());
</script>

<section class="card overflow-hidden border-primary" aria-label="Informasi operator shift">
  <div class="border-b-[1.5px] border-line px-4 pt-3 pb-2">
    <p class="text-[13px] font-semibold text-ink">{SPBU.nama}</p>
    <p class="text-[11px] text-muted">{SPBU.alamat}</p>
  </div>

  <div class="flex items-center gap-3 px-4 py-3">
    <div class="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-lg font-extrabold text-white">
      {initial}
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate font-bold text-ink">{operator.nama}</p>
      <p class="font-mono text-xs text-muted">#{operator.nomor}</p>
    </div>
    <Badge tone="success"><span class="size-1.5 rounded-full bg-tertiary"></span>AKTIF</Badge>
  </div>

  <div class="grid grid-cols-2 border-t-[1.5px] border-line">
    <div class="py-2.5 text-center">
      <p class="text-[11px] text-muted">Nozzle</p>
      <p class="font-mono text-base font-bold text-ink">{operator.nozzle}</p>
    </div>
    <div class="border-l-[1.5px] border-line py-2.5 text-center">
      <p class="text-[11px] text-muted">Jam Masuk</p>
      <p class="font-mono text-base font-bold text-ink">{operator.jamMasuk}</p>
    </div>
  </div>
</section>
