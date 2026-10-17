<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '$lib/components/app/AppShell.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { flow, resetFlow } from '$lib/stores/flow.svelte';
  import { ringkasanHariIni } from '$lib/stores/transaksi.svelte';
  import { formatPlat } from '$lib/utils/plate';
  import { liter } from '$lib/utils/format';
  import type { Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();

  let ringkasan = $derived(ringkasanHariIni());

  onMount(() => {
    navigator.vibrate?.(60);
  });

  function selesai(): void {
    resetFlow();
    onnavigate('beranda');
  }

  function scanLagi(): void {
    resetFlow();
    onnavigate('scan');
  }
</script>

<AppShell {current} {onnavigate}>
  <div class="flex flex-col items-center gap-4 py-6 text-center">
    <div
      class="grid size-20 animate-[pop_260ms_ease-out] place-items-center rounded-full bg-tertiary-soft text-4xl font-extrabold text-tertiary"
      aria-hidden="true"
    >
      ✓
    </div>

    <div>
      <h1 class="text-xl font-extrabold text-ink">Transaksi Tersimpan</h1>
      <p class="mt-1 text-sm text-muted">Pencatatan tercatat di perangkat ini.</p>
    </div>

    {#if flow.last}
      <div class="card w-full px-4 py-4">
        <p class="plate text-2xl">{formatPlat(flow.last.plat)}</p>
        <p class="mt-1 text-[15px] text-muted">
          {flow.last.bbm} · {liter(flow.last.liter)} L
        </p>
        <p class="mt-0.5 font-mono text-[13px] text-muted">{flow.last.waktu}</p>
      </div>
    {/if}

    <p class="text-sm text-muted">
      Total hari ini: <span class="font-semibold text-ink">{ringkasan.count} transaksi</span> ·
      <span class="font-semibold text-ink">{liter(ringkasan.liter)} L</span>
    </p>

    <div class="w-full space-y-2 pt-2">
      <Button size="lg" full onclick={selesai}>Selesai</Button>
      <Button variant="secondary" size="lg" full onclick={scanLagi}>Scan Lagi</Button>
    </div>
  </div>
</AppShell>
