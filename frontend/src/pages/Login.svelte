<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { repo, messageOf } from '$lib/repo';
  import { beginSession } from '$lib/stores/session.svelte';
  import { pushToast } from '$lib/stores/toast.svelte';
  import { go } from '$lib/router.svelte';
  import { DEMO_OPERATOR, NOZZLES } from '$lib/data/operators';
  import { nowTime } from '$lib/utils/plate';

  let nomor = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let nozzleOpen = $state(false);
  let account = $state<{ nomor: string; nama: string } | null>(null);

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    error = '';

    if (nomor.trim() === '' || password.trim() === '') {
      error = 'Masukkan nomor operator dan password.';
      return;
    }

    loading = true;

    try {
      account = await repo.login(nomor, password);
      nozzleOpen = true;
    } catch (caught) {
      error = messageOf(caught);
    } finally {
      loading = false;
    }
  }

  function pilihNozzle(nozzle: string): void {
    if (account === null) return;

    beginSession(account.nomor, account.nama, nozzle, nowTime());
    nozzleOpen = false;
    pushToast(`Selamat bekerja, ${account.nama}. Nozzle ${nozzle}.`, 'success');
    go('beranda');
  }
</script>

<div class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
  <div class="text-center">
    <p class="text-[32px] leading-none font-extrabold tracking-tight text-primary sm:text-[34px]">ANPR SPBU</p>
    <p class="mt-2 text-sm text-muted">Masuk shift petugas</p>
  </div>

  <form class="card space-y-4 p-5" onsubmit={submit} novalidate>
    <Input
      label="No. Operator"
      bind:value={nomor}
      inputmode="numeric"
      maxlength={10}
      placeholder="cth: 21045"
      oninput={() => (error = '')}
    />

    <Input
      label="Password"
      type="password"
      bind:value={password}
      autocomplete="current-password"
      placeholder="••••"
      oninput={() => (error = '')}
    />

    {#if error !== ''}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger-ink" role="alert">
        {error}
      </p>
    {/if}

    <Button type="submit" size="lg" full {loading}>Masuk</Button>

    <p class="text-center text-xs text-muted">
      Akun demo: <span class="font-mono font-semibold">{DEMO_OPERATOR.nomor}</span> · password
      <span class="font-mono font-semibold">{DEMO_OPERATOR.password}</span>
    </p>
  </form>

  <p class="text-center text-xs text-muted">
    Data pada tahap ini disimpan di perangkat (dummy data), bukan database.
  </p>
</div>

<Dialog
  bind:open={nozzleOpen}
  title="Pilih Nozzle"
  description="Pilih nozzle yang dipakai pada shift ini."
>
  <div class="grid grid-cols-4 gap-2">
    {#each NOZZLES as nozzle (nozzle)}
      <Button variant="secondary" size="lg" onclick={() => pilihNozzle(nozzle)}>{nozzle}</Button>
    {/each}
  </div>
</Dialog>
