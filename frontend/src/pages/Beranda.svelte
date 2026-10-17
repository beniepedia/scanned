<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '$lib/components/app/AppShell.svelte';
  import OperatorCard from '$lib/components/app/OperatorCard.svelte';
  import MetricCard from '$lib/components/app/MetricCard.svelte';
  import TxRow from '$lib/components/app/TxRow.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import { repo, messageOf } from '$lib/repo';
  import { session, endSession } from '$lib/stores/session.svelte';
  import { resetFlow } from '$lib/stores/flow.svelte';
  import {
    txState,
    loadTransaksi,
    hariIni,
    ringkasanHariIni,
  } from '$lib/stores/transaksi.svelte';
  import { go } from '$lib/router.svelte';
  import { liter } from '$lib/utils/format';
  import type { Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();

  let totalMotor = $state(0);
  let loadingMotor = $state(true);
  let motorError = $state('');
  let logoutOpen = $state(false);

  let riwayat = $derived(hariIni());
  let ringkasan = $derived(ringkasanHariIni());

  onMount(async () => {
    await loadTransaksi();

    try {
      totalMotor = (await repo.listMotors()).length;
    } catch (caught) {
      motorError = messageOf(caught);
    } finally {
      loadingMotor = false;
    }
  });

  function logout(): void {
    endSession();
    resetFlow();
    logoutOpen = false;
    go('login');
  }
</script>

<AppShell {current} {onnavigate}>
  <div class="space-y-4">
    {#if session.operator}
      <OperatorCard operator={session.operator} />
    {/if}

    <div class="grid grid-cols-3 gap-2">
      <MetricCard label="Hari Ini" value={String(ringkasan.count)} />
      <MetricCard label="Total Liter" value={liter(ringkasan.liter)} suffix="L" />
      <MetricCard
        label="Motor"
        value={loadingMotor ? '…' : String(totalMotor)}
      />
    </div>

    {#if motorError !== ''}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
        {motorError}
      </p>
    {/if}

    <Button size="lg" full onclick={() => onnavigate('scan')}>Scan Plat Motor</Button>

    <section class="space-y-2" aria-label="Riwayat hari ini">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-ink">Riwayat Hari Ini</h2>
        {#if riwayat.length > 0}
          <button
            type="button"
            class="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-secondary"
            onclick={() => onnavigate('riwayat')}
          >
            Lihat semua
          </button>
        {/if}
      </div>

      {#if txState.loading}
        <div class="card flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <Spinner class="size-4" /> Memuat transaksi…
        </div>
      {:else if txState.error !== ''}
        <div class="card space-y-2 p-4 text-sm">
          <p class="text-danger-ink">{txState.error}</p>
          <Button variant="secondary" onclick={loadTransaksi}>Coba lagi</Button>
        </div>
      {:else if riwayat.length === 0}
        <div class="card">
          <EmptyState
            icon="⛽"
            title="Belum ada transaksi hari ini"
            description="Tekan Scan Plat Motor untuk mencatat pengisian pertama."
          />
        </div>
      {:else}
        <div class="space-y-2">
          {#each riwayat.slice(0, 5) as transaksi (transaksi.id)}
            <TxRow {transaksi} highlight={transaksi.id === riwayat[0]?.id} />
          {/each}
        </div>
      {/if}
    </section>

    <button
      type="button"
      class="mx-auto mt-2 flex min-h-11 items-center justify-center px-3 text-xs font-semibold text-muted underline decoration-dotted"
      onclick={() => (logoutOpen = true)}
    >
      Akhiri shift / keluar
    </button>
  </div>
</AppShell>

<Dialog
  bind:open={logoutOpen}
  title="Akhiri shift?"
  description="Sesi operator akan dihapus dari perangkat ini."
>
  {#snippet footer()}
    <Button variant="secondary" onclick={() => (logoutOpen = false)}>Batal</Button>
    <Button variant="danger" onclick={logout}>Keluar</Button>
  {/snippet}
</Dialog>
