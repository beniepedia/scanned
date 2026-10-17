<script lang="ts">
  import { formatPlat } from '$lib/utils/plate';
  import { liter } from '$lib/utils/format';
  import type { Transaksi } from '$lib/types';

  interface Props {
    transaksi: Transaksi;
    highlight?: boolean;
    ondelete?: (transaksi: Transaksi) => void;
  }

  let { transaksi, highlight = false, ondelete }: Props = $props();
</script>

<div
  class={[
    'card flex items-center gap-3 px-4 py-3',
    highlight ? 'border-primary' : '',
  ].join(' ')}
>
  <div class="min-w-0 flex-1">
    <p class="plate truncate text-base">{formatPlat(transaksi.plat)}</p>
    <p class="mt-0.5 text-[13px] text-muted">
      {transaksi.bbm} · {liter(transaksi.liter)} L
    </p>
  </div>

  <p class="font-mono text-xs text-muted">{transaksi.waktu}</p>

  {#if ondelete}
    <button
      type="button"
      class="min-h-11 rounded-lg px-3 text-xs font-semibold text-danger-ink hover:bg-danger-soft"
      aria-label={`Hapus transaksi ${formatPlat(transaksi.plat)}`}
      onclick={() => ondelete(transaksi)}
    >
      Hapus
    </button>
  {/if}
</div>
