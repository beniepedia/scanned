<script lang="ts">
  import AppShell from '$lib/components/app/AppShell.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import NumberPad from '$lib/components/ui/NumberPad.svelte';
  import { fuels } from '$lib/data/fuels';
  import { addTransaksi } from '$lib/stores/transaksi.svelte';
  import { flow, setLastTransaksi } from '$lib/stores/flow.svelte';
  import { pushToast } from '$lib/stores/toast.svelte';
  import { messageOf } from '$lib/repo';
  import { go } from '$lib/router.svelte';
  import { formatPlat } from '$lib/utils/plate';
  import { liter } from '$lib/utils/format';
  import type { BbmType, Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();

  let bbm = $state<BbmType>('Pertalite');
  let literInput = $state('');
  let error = $state('');
  let saving = $state(false);

  let value = $derived(Number(literInput.replace(',', '.')));
  let canSubmit = $derived(literInput !== '' && value > 0 && value <= 100);

  async function submit(): Promise<void> {
    if (!canSubmit) {
      error = 'Jumlah liter harus angka antara 0–100 (cth: 2.5).';
      return;
    }

    error = '';
    saving = true;

    try {
      const created = await addTransaksi({
        plat: flow.plat,
        bbm,
        liter: value,
        warna: flow.motor?.warna,
      });
      setLastTransaksi(created);
      pushToast('Transaksi tersimpan di perangkat.', 'success');
      go('sukses');
    } catch (caught) {
      error = messageOf(caught);
    } finally {
      saving = false;
    }
  }
</script>

<AppShell {current} {onnavigate}>
  <div class="space-y-4">
    <div class="card px-4 py-3 text-center">
      <p class="plate text-2xl">{formatPlat(flow.plat)}</p>
      {#if flow.motor}
        <p class="mt-1 text-sm text-muted">{flow.motor.nama} · {flow.motor.jenis}</p>
      {/if}
    </div>

    <section class="space-y-2">
      <h2 class="text-sm font-semibold text-ink">Pilih Jenis BBM</h2>

      <div class="grid gap-2 sm:grid-cols-3">
        {#each fuels as fuel (fuel.type)}
          <button
            type="button"
            onclick={() => (bbm = fuel.type)}
            aria-pressed={bbm === fuel.type}
            class="flex items-center gap-3 rounded-[var(--radius-card)] border-[1.5px] px-4 py-3 text-left transition"
            class:border-ink={bbm === fuel.type}
            class:border-line={bbm !== fuel.type}
            class:bg-surface={true}
          >
            <span
              class="size-3 shrink-0 rounded-full"
              style="background-color: {fuel.accent}"
              aria-hidden="true"
            ></span>
            <span class="min-w-0 flex-1">
              <span class="block text-[15px] font-bold text-ink">{fuel.type}</span>
              <span class="block text-xs text-muted">{fuel.note}</span>
            </span>
            {#if bbm === fuel.type}
              <span class="text-xs font-bold text-primary">✓</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>

    <section class="space-y-2">
      <h2 class="text-sm font-semibold text-ink">Jumlah Liter</h2>

      <div class="card flex items-baseline justify-center gap-2 px-4 py-4">
        <span class="font-mono text-4xl font-extrabold text-ink">{literInput || '0'}</span>
        <span class="text-sm font-semibold text-muted">liter</span>
      </div>

      {#if literInput !== '' && value > 0}
        <p class="text-center text-xs text-muted">Total pembacaan: {liter(value)} L</p>
      {/if}

      {#if error !== ''}
        <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
          {error}
        </p>
      {/if}

      <NumberPad value={literInput} onchange={(v) => {
        literInput = v;
        error = '';
      }} />
    </section>

    <div class="grid grid-cols-2 gap-2">
      <Button variant="secondary" onclick={() => go('scan')}>Batal</Button>
      <Button disabled={!canSubmit} loading={saving} onclick={() => void submit()}>Simpan</Button>
    </div>
  </div>
</AppShell>
