<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '$lib/components/app/AppShell.svelte';
  import TxRow from '$lib/components/app/TxRow.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import { BBM_TYPES, type BbmType, type Route, type Transaksi } from '$lib/types';
  import {
    txState,
    loadTransaksi,
    hariIni,
    removeTransaksi,
    ringkasanHariIni,
  } from '$lib/stores/transaksi.svelte';
  import { pushToast } from '$lib/stores/toast.svelte';
  import { messageOf } from '$lib/repo';
  import { formatPlat, normalisePlat } from '$lib/utils/plate';
  import { liter } from '$lib/utils/format';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();

  const PAGE_SIZE = 10;

  let query = $state('');
  let filter = $state<'semua' | BbmType>('semua');
  let page = $state(1);
  let deleteTarget = $state<Transaksi | null>(null);
  let deleteOpen = $state(false);
  let deleting = $state(false);

  let ringkasan = $derived(ringkasanHariIni());
  let semua = $derived(hariIni());

  let hasil = $derived(
    semua.filter((t) => {
      const cocokJenis = filter === 'semua' || t.bbm === filter;
      const key = normalisePlat(query.trim());
      const cocokCari = key === '' || t.plat.includes(key);
      return cocokJenis && cocokCari;
    })
  );

  let totalHalaman = $derived(Math.max(1, Math.ceil(hasil.length / PAGE_SIZE)));
  let halaman = $derived(hasil.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));

  $effect(() => {
    if (page > totalHalaman) page = totalHalaman;
  });

  onMount(() => {
    void loadTransaksi();
  });

  async function confirmDelete(): Promise<void> {
    if (deleteTarget === null) return;

    deleting = true;

    try {
      await removeTransaksi(deleteTarget.id);
      pushToast('Transaksi dihapus dari perangkat.', 'success');
      deleteOpen = false;
      deleteTarget = null;
    } catch (caught) {
      pushToast(messageOf(caught), 'error');
    } finally {
      deleting = false;
    }
  }
</script>

<AppShell {current} {onnavigate}>
  <div class="space-y-3">
    <div>
      <h1 class="text-xl font-extrabold text-ink">Riwayat Transaksi</h1>
      <p class="mt-0.5 text-[13px] text-muted">
        Hari ini · {ringkasan.count} transaksi · {liter(ringkasan.liter)} L
      </p>
    </div>

    <input
      class="field"
      bind:value={query}
      placeholder="Cari plat… (cth: B 1234)"
      aria-label="Cari nomor plat"
      oninput={() => (page = 1)}
    />

    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter jenis BBM">
      <button
        type="button"
        class="min-h-11 rounded-full border-[1.5px] px-3 text-xs font-semibold"
        class:border-primary={filter === 'semua'}
        class:bg-primary-soft={filter === 'semua'}
        class:text-primary={filter === 'semua'}
        class:border-line={filter !== 'semua'}
        class:text-muted={filter !== 'semua'}
        aria-pressed={filter === 'semua'}
        onclick={() => {
          filter = 'semua';
          page = 1;
        }}>Semua</button
      >

      {#each BBM_TYPES as type (type)}
        <button
          type="button"
          class="min-h-11 rounded-full border-[1.5px] px-3 text-xs font-semibold"
          class:border-primary={filter === type}
          class:bg-primary-soft={filter === type}
          class:text-primary={filter === type}
          class:border-line={filter !== type}
          class:text-muted={filter !== type}
          aria-pressed={filter === type}
          onclick={() => {
            filter = type;
            page = 1;
          }}>{type}</button
        >
      {/each}
    </div>

    {#if txState.loading}
      <div class="space-y-2" aria-label="Memuat riwayat">
        {#each [1, 2, 3, 4] as index (index)}
          <div class="card px-4 py-3">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="mt-2 h-3 w-44" />
          </div>
        {/each}
      </div>
    {:else if txState.error !== ''}
      <div class="card space-y-2 p-4">
        <p class="text-sm text-danger-ink">{txState.error}</p>
        <Button variant="secondary" onclick={loadTransaksi}>Coba lagi</Button>
      </div>
    {:else if semua.length === 0}
      <div class="card">
        <EmptyState
          icon="⛽"
          title="Belum ada transaksi hari ini"
          description="Transaksi yang dicatat lewat scan akan tampil di sini."
        />
      </div>
    {:else if hasil.length === 0}
      <div class="card">
        <EmptyState
          icon="🔍"
          title="Tidak ada hasil"
          description="Ubah kata kunci pencarian atau filter jenis BBM."
        />
      </div>
    {:else}
      <div class="space-y-2">
        {#each halaman as transaksi (transaksi.id)}
          <TxRow
            {transaksi}
            ondelete={(t) => {
              deleteTarget = t;
              deleteOpen = true;
            }}
          />
        {/each}
      </div>

      {#if totalHalaman > 1}
        <div class="flex items-center justify-between pt-1">
          <Button
            variant="secondary"
            disabled={page === 1}
            onclick={() => (page = Math.max(1, page - 1))}>Sebelumnya</Button
          >
          <p class="text-xs text-muted">Halaman {page} / {totalHalaman}</p>
          <Button
            variant="secondary"
            disabled={page === totalHalaman}
            onclick={() => (page = Math.min(totalHalaman, page + 1))}>Berikutnya</Button
          >
        </div>
      {/if}
    {/if}
  </div>
</AppShell>

<Dialog
  bind:open={deleteOpen}
  title="Hapus transaksi?"
  description={deleteTarget
    ? `${formatPlat(deleteTarget.plat)} · ${deleteTarget.waktu}`
    : ''}
>
  <p class="text-sm text-muted">
    Transaksi dihapus dari penyimpanan lokal perangkat. Tindakan ini tidak bisa dibatalkan.
  </p>

  {#snippet footer()}
    <Button variant="secondary" onclick={() => (deleteOpen = false)}>Batal</Button>
    <Button variant="danger" loading={deleting} onclick={() => void confirmDelete()}>Hapus</Button>
  {/snippet}
</Dialog>
