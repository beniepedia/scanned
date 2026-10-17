<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '$lib/components/app/AppShell.svelte';
  import ScanOverlay from '$lib/components/app/ScanOverlay.svelte';
  import PlateKeypad from '$lib/components/app/PlateKeypad.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { repo, messageOf } from '$lib/repo';
  import { sudahIsiHariIni } from '$lib/stores/transaksi.svelte';
  import { setPendingPlate } from '$lib/stores/flow.svelte';
  import { pushToast } from '$lib/stores/toast.svelte';
  import { go } from '$lib/router.svelte';
  import { getOcrWorker, preprocessFrame, recognise, terminateOcr } from '$lib/ocr/scanner';
  import { extractPlatFromText, formatPlat, isPlatValid, normalisePlat } from '$lib/utils/plate';
  import type { Motor, Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();

  type CameraStatus = 'requesting' | 'ready' | 'denied' | 'unavailable';

  const SCAN_INTERVAL = 2500;
  const MAX_ATTEMPTS = 4;

  let camera: CameraStatus = $state('requesting');
  let ocrMessage = $state('Menyiapkan kamera…');
  let attempts = $state(0);
  let busy = $state(false);

  let video: HTMLVideoElement | null = $state(null);
  let stream: MediaStream | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  let manualOpen = $state(false);
  let manualPlat = $state('');
  let manualError = $state('');

  let newMotorOpen = $state(false);
  let pendingPlat = $state('');
  let nama = $state('');
  let jenis = $state('');
  let formError = $state('');
  let savingMotor = $state(false);

  let filledOpen = $state(false);

  let manualPreview = $derived(formatPlat(manualPlat));

  onMount(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      camera = 'unavailable';
      ocrMessage = 'Perangkat/browser ini tidak mendukung kamera.';
    } else {
      void startCamera();
    }

    return () => {
      stopScanLoop();
      stopCamera();
      void terminateOcr();
    };
  });

  async function startCamera(): Promise<void> {
    camera = 'requesting';

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });

      if (video !== null) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }

      camera = 'ready';
      startScanLoop();
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : '';
      camera = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable';
      ocrMessage =
        camera === 'denied'
          ? 'Izin kamera ditolak. Aktifkan izin kamera, atau pakai input manual.'
          : 'Kamera tidak tersedia. Kamera butuh HTTPS atau localhost.';
    }
  }

  function stopCamera(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;

    if (video !== null) video.srcObject = null;
  }

  function startScanLoop(): void {
    stopScanLoop();
    attempts = 0;
    ocrMessage = 'Memuat mesin OCR…';
    intervalId = setInterval(() => void tryScan(), SCAN_INTERVAL);

    timeoutId = setTimeout(() => {
      stopScanLoop();
      ocrMessage = 'Plat belum terbaca otomatis.';
      manualOpen = true;
      pushToast('Plat belum terbaca. Silakan input manual.', 'info');
    }, 12_000);

    void getOcrWorker((status, progress) => {
      if (status === 'recognizing text') return;
      ocrMessage = `Memuat OCR… ${Math.round(progress * 100)}%`;
    }).catch((caught) => {
      ocrMessage = `OCR gagal dimuat: ${messageOf(caught)}`;
    });
  }

  function stopScanLoop(): void {
    if (intervalId !== null) clearInterval(intervalId);
    if (timeoutId !== null) clearTimeout(timeoutId);
    intervalId = null;
    timeoutId = null;
  }

  async function tryScan(): Promise<void> {
    if (busy || camera !== 'ready' || video === null || video.videoWidth === 0) return;

    busy = true;

    try {
      const canvas = preprocessFrame(video);
      const text = await recognise(canvas);
      const plat = extractPlatFromText(text);
      attempts += 1;

      if (plat !== null) {
        stopScanLoop();
        ocrMessage = `Terbaca: ${formatPlat(plat)}`;
        await resolvePlate(plat);
        return;
      }

      ocrMessage =
        text.trim() === ''
          ? 'Belum ada teks terbaca. Dekatkan plat ke kotak…'
          : `Terbaca "${text.trim().slice(0, 32)}". Coba lagi…`;

      if (attempts >= MAX_ATTEMPTS) {
        stopScanLoop();
        manualOpen = true;
        pushToast('Plat belum terbaca otomatis. Silakan input manual.', 'info');
      }
    } catch (caught) {
      stopScanLoop();
      ocrMessage = `OCR gagal: ${messageOf(caught)}`;
    } finally {
      busy = false;
    }
  }

  async function resolvePlate(plat: string): Promise<void> {
    pendingPlat = normalisePlat(plat);
    const motor = await repo.findMotor(pendingPlat).catch(() => null);

    if (motor === null) {
      nama = '';
      jenis = '';
      formError = '';
      newMotorOpen = true;
      return;
    }

    proceed(motor);
  }

  function proceed(motor: Motor): void {
    stopScanLoop();
    stopCamera();
    setPendingPlate(motor.plat, motor);

    if (sudahIsiHariIni(motor.plat)) {
      filledOpen = true;
      return;
    }

    go('bbm');
  }

  function submitManual(): void {
    if (!isPlatValid(manualPlat)) {
      manualError = 'Nomor plat tidak valid. Contoh: B 1234 ABC.';
      return;
    }

    manualError = '';
    manualOpen = false;
    void resolvePlate(manualPlat);
  }

  async function saveMotor(): Promise<void> {
    if (nama.trim() === '' || jenis.trim() === '') {
      formError = 'Nama pemilik dan jenis kendaraan wajib diisi.';
      return;
    }

    savingMotor = true;

    try {
      const motor = await repo.createMotor({ plat: pendingPlat, nama: nama, jenis: jenis });
      newMotorOpen = false;
      pushToast(`Kendaraan ${formatPlat(motor.plat)} ditambahkan (data lokal).`, 'success');
      proceed(motor);
    } catch (caught) {
      formError = messageOf(caught);
    } finally {
      savingMotor = false;
    }
  }

  async function simulateScan(): Promise<void> {
    const motors = await repo.listMotors().catch(() => []);

    if (motors.length === 0) {
      pushToast('Belum ada data motor untuk simulasi.', 'error');
      return;
    }

    const picked = motors[Math.floor(Math.random() * motors.length)];
    pushToast(`Simulasi: ${formatPlat(picked.plat)}`, 'info');
    await resolvePlate(picked.plat);
  }

  function cancelFlow(): void {
    stopScanLoop();
    stopCamera();
    go('beranda');
  }
</script>

<AppShell {current} {onnavigate}>
  <div class="space-y-3">
    <div class="relative overflow-hidden rounded-[var(--radius-card)] bg-ink">
      <video
        bind:this={video}
        class="h-[52vh] max-h-[460px] w-full object-cover md:h-[58vh]"
        autoplay
        playsinline
        muted
      ></video>

      {#if camera === 'ready'}
        <ScanOverlay active={true} />
      {/if}

      {#if camera !== 'ready'}
        <div
          class="absolute inset-0 grid place-items-center bg-ink/85 p-6 text-center text-white"
        >
          <div class="space-y-2">
            <p class="text-lg font-bold">
              {camera === 'requesting'
                ? 'Menyiapkan kamera…'
                : camera === 'denied'
                  ? 'Izin kamera ditolak'
                  : 'Kamera tidak tersedia'}
            </p>
            <p class="mx-auto max-w-xs text-sm text-white/70">{ocrMessage}</p>
            {#if camera !== 'requesting'}
              <Button variant="secondary" size="md" onclick={() => (manualOpen = true)}>
                Input plat manual
              </Button>
            {/if}
          </div>
        </div>
      {/if}

      {#if camera === 'ready'}
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
          <p class="text-center text-xs font-medium text-white/90">{ocrMessage}</p>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-2">
      <Button variant="secondary" onclick={() => (manualOpen = true)}>Input Manual</Button>
      <Button variant="ghost" onclick={cancelFlow}>Batal</Button>
    </div>

    <div class="card flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p class="text-sm font-semibold text-ink">Tidak ada kamera?</p>
        <p class="text-xs text-muted">Coba alur dengan plat contoh dari data dummy.</p>
      </div>
      <Button variant="secondary" onclick={() => void simulateScan()}>Simulasi</Button>
    </div>
  </div>
</AppShell>

<Dialog
  bind:open={manualOpen}
  title="Masukkan Nomor Plat"
  description="Ketik atau pakai keypad di bawah."
>
  <div class="space-y-3">
    <input
      class="field plate text-center text-xl uppercase"
      bind:value={manualPlat}
      placeholder="B 1234 ABC"
      inputmode="text"
      autocomplete="off"
      aria-label="Nomor plat"
      oninput={() => {
        manualPlat = manualPlat.toUpperCase();
        manualError = '';
      }}
    />

    <p class="text-center font-mono text-sm text-muted">{manualPreview || '—'}</p>

    {#if manualError !== ''}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
        {manualError}
      </p>
    {/if}

    <PlateKeypad value={manualPlat} onchange={(v) => (manualPlat = v)} />
  </div>

  {#snippet footer()}
    <Button variant="secondary" onclick={() => (manualOpen = false)}>Batal</Button>
    <Button onclick={submitManual}>Lanjut</Button>
  {/snippet}
</Dialog>

<Dialog
  bind:open={newMotorOpen}
  title="Kendaraan Baru"
  description={`Plat ${formatPlat(pendingPlat)} belum terdaftar. Lengkapi data kendaraan.`}
>
  <div class="space-y-3">
    <div>
      <label class="field-label" for="nama-pemilik">Nama pemilik</label>
      <input
        id="nama-pemilik"
        class="field"
        bind:value={nama}
        placeholder="cth: Andi"
        maxlength="80"
      />
    </div>

    <div>
      <label class="field-label" for="jenis-kendaraan">Jenis kendaraan</label>
      <input
        id="jenis-kendaraan"
        class="field"
        bind:value={jenis}
        placeholder="cth: Honda Beat"
        maxlength="80"
      />
    </div>

    {#if formError !== ''}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
        {formError}
      </p>
    {/if}

    <p class="text-xs text-muted">Disimpan di perangkat ini (dummy data), belum ke database.</p>
  </div>

  {#snippet footer()}
    <Button variant="secondary" onclick={() => (newMotorOpen = false)}>Batal</Button>
    <Button loading={savingMotor} onclick={() => void saveMotor()}>Simpan</Button>
  {/snippet}
</Dialog>

<Dialog
  bind:open={filledOpen}
  title="Motor Sudah Isi Hari Ini"
  description={`${formatPlat(pendingPlat)} sudah melakukan pengisian hari ini.`}
>
  <p class="text-sm text-muted">
    Lanjutkan untuk pengisian berikutnya (pelangsir)? Data pengisian sebelumnya tetap tersimpan.
  </p>

  {#snippet footer()}
    <Button
      variant="secondary"
      onclick={() => {
        filledOpen = false;
        go('beranda');
      }}>Tidak</Button
    >
    <Button
      onclick={() => {
        filledOpen = false;
        go('bbm');
      }}>Lanjut (Pelangsir)</Button
    >
  {/snippet}
</Dialog>
