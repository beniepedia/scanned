<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '$lib/components/app/AppShell.svelte';
  import ScanOverlay from '$lib/components/app/ScanOverlay.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { repo, messageOf } from '$lib/repo';
  import { sudahIsiHariIni } from '$lib/stores/transaksi.svelte';
  import { resetFlow, setPendingPlate } from '$lib/stores/flow.svelte';
  import { pushToast } from '$lib/stores/toast.svelte';
  import { go } from '$lib/router.svelte';
  import { capturePhoto, startPreview, stopPreview } from '$lib/camera/capture';
  import { compressImage } from '$lib/camera/compress';
  import { analyzeVehicle, VehicleApiError, type VehicleAnalysis } from '$lib/api/vehicle';
  import { formatPlat, isPlatValid, normalisePlat } from '$lib/utils/plate';
  import { detectPlate, frameSharpness, type PlateCandidate } from '$lib/vision/plate-detector';
  import { createAutoTrigger } from '$lib/vision/auto-trigger';
  import { scanMode, setScanMode } from '$lib/stores/scanMode.svelte';
  import type { Motor, Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();

  type CameraStatus = 'requesting' | 'ready' | 'paused' | 'denied' | 'unavailable';

  const AUTO_INTERVAL_MS = 350;
  const AUTO_COOLDOWN_MS = Number(import.meta.env.VITE_AUTO_SCAN_COOLDOWN_MS ?? 10_000);
  const AUTO_MAX_UPLOADS = Number(import.meta.env.VITE_AUTO_SCAN_MAX_UPLOADS ?? 3);
  const AUTO_STABLE_FRAMES = Number(import.meta.env.VITE_AUTO_SCAN_STABLE_FRAMES ?? 3);
  const MIN_SHARPNESS = 40;

  const trigger = createAutoTrigger({ minStable: AUTO_STABLE_FRAMES });

  let camera: CameraStatus = $state('requesting');
  let online = $state(navigator.onLine);

  let video: HTMLVideoElement | null = $state(null);
  let stream: MediaStream | null = null;
  let leaving = false;
  let pendingResolve = $state(false);

  let processing = $state(false);
  let progress = $state('');
  let errorMessage = $state('');

  let analysis = $state<VehicleAnalysis | null>(null);
  let analysisPlate = $state('');
  let resultOpen = $state(false);

  let manualOpen = $state(false);
  let manualPlat = $state('');
  let manualError = $state('');

  let pendingPlat = $state('');

  let autoActive = $state(scanMode.mode === 'auto');
  let autoAttempts = $state(0);
  let autoCandidates = $state<PlateCandidate[]>([]);
  let autoProgress = $state(0);
  let cooldownLeft = $state(0);
  let autoNote = $state('');
  let cooldownUntil = 0;

  let filledOpen = $state(false);

  let analysisPreview = $derived(formatPlat(analysisPlate));
  let manualPreview = $derived(formatPlat(manualPlat));
  let analysisValid = $derived(isPlatValid(analysisPlate));

  let autoStatus = $derived.by(() => {
    if (!autoActive) return 'Auto Scan nonaktif';
    if (cooldownLeft > 0) return `Cooldown ${cooldownLeft} detik`;
    if (autoNote !== '') return autoNote;
    if (autoProgress >= 1) return 'Plat stabil — mengambil gambar';
    if (autoCandidates.length > 0) return 'Plat terdeteksi — menstabilkan';
    return 'Mencari plat…';
  });

  // Dialog terbuka = kamera berhenti (hemat baterai). Ditutup = preview lagi.
  $effect(() => {
    const dialogOpen = resultOpen || manualOpen || filledOpen;

    if (dialogOpen) {
      if (camera === 'ready') pausePreview();
      return;
    }

    if (camera === 'paused' && !leaving && !pendingResolve) {
      void startCamera();
    }
  });

  $effect(() => {
    if (!autoActive || camera !== 'ready') return;

    const id = setInterval(runAutoFrame, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  });

  $effect(() => {
    if (!autoActive) {
      cooldownLeft = 0;
      return;
    }

    const id = setInterval(() => {
      cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
    }, 500);

    return () => clearInterval(id);
  });

  onMount(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      camera = 'unavailable';
    } else {
      void startCamera();
    }

    const updateOnline = () => (online = navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    return () => {
      leaving = true;
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      stopPreview(stream, video);
    };
  });

  async function startCamera(): Promise<void> {
    if (video === null) return;

    camera = 'requesting';

    try {
      stream = await startPreview(video);
      camera = 'ready';
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : '';
      camera = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable';
      errorMessage =
        camera === 'denied'
          ? 'Izin kamera ditolak. Aktifkan izin kamera untuk memakai fitur scan.'
          : 'Kamera tidak tersedia. Kamera butuh HTTPS atau localhost.';
    }
  }

  function pausePreview(): void {
    stopPreview(stream, video);
    stream = null;
    camera = 'paused';
  }

  async function capture(): Promise<void> {
    await doCapture(false);
  }

  async function captureAuto(): Promise<void> {
    if (video === null) return;

    if (frameSharpness(video) < MIN_SHARPNESS) {
      autoNote = 'Gambar kurang tajam — tahan posisi';
      trigger.reset();
      autoProgress = 0;
      return;
    }

    autoNote = '';
    await doCapture(true);
  }

  async function doCapture(auto: boolean): Promise<void> {
    if (processing || camera !== 'ready' || video === null || stream === null) return;

    processing = true;
    errorMessage = '';
    progress = auto ? 'Plat terdeteksi — mengambil gambar…' : 'Mengambil gambar…';

    try {
      const raw = await capturePhoto(video, stream);
      progress = 'Mengompres gambar…';

      const compressed = await compressImage(raw);
      progress = `Mengirim gambar (${Math.round(compressed.blob.size / 1024)} KB)…`;

      const result = await analyzeVehicle(compressed.blob);

      analysis = result;
      analysisPlate = result.plate ?? '';
      resultOpen = true;

      if (auto) {
        // Satu hasil sukses = auto berhenti; operator lanjut lewat dialog.
        setAuto(false);
        autoAttempts = 0;
      } else {
        cooldownUntil = Date.now() + AUTO_COOLDOWN_MS;
      }
    } catch (caught) {
      handleFailure(caught);

      if (auto) {
        autoAttempts += 1;
        cooldownUntil = Date.now() + AUTO_COOLDOWN_MS;

        if (autoAttempts >= AUTO_MAX_UPLOADS) {
          setAuto(false);
          autoNote = 'Auto Scan berhenti setelah beberapa percobaan.';
        }
      }
    } finally {
      processing = false;
      progress = '';
    }
  }

  function runAutoFrame(): void {
    if (!autoActive || processing || camera !== 'ready' || video === null) return;
    if (resultOpen || manualOpen || filledOpen || document.hidden) return;
    if (Date.now() < cooldownUntil) return;

    const candidates = detectPlate(video);
    autoCandidates = candidates;

    const state = trigger.push(candidates[0] ?? null);
    autoProgress = trigger.progress();

    if (state === 'trigger') {
      autoNote = '';
      void captureAuto();
    } else if (state === 'reset') {
      autoNote = '';
    }
  }

  function setAuto(active: boolean): void {
    autoActive = active;
    setScanMode(active ? 'auto' : 'manual');
    trigger.reset();
    autoCandidates = [];
    autoProgress = 0;
    autoNote = '';

    if (active) {
      autoAttempts = 0;
      cooldownUntil = 0;
      cooldownLeft = 0;
    }
  }

  /** Backend menolak / jaringan gagal → input manual otomatis terbuka. */
  function handleFailure(caught: unknown): void {
    if (caught instanceof VehicleApiError) {
      errorMessage = caught.message;
    } else {
      errorMessage = messageOf(caught);
    }

    pushToast(errorMessage, 'error');
    manualPlat = analysis?.plate ?? '';
    manualError = '';
    manualOpen = true;
  }

  async function resolvePlate(plat: string): Promise<void> {
    pendingResolve = true;
    pendingPlat = normalisePlat(plat);

    try {
      const motor = await repo.findMotor(pendingPlat).catch(() => null);

      if (motor === null) {
        proceed(await registerVehicle(pendingPlat));
        return;
      }

      proceed(motor);
    } finally {
      pendingResolve = false;
    }
  }

  function proceed(motor: Motor): void {
    leaving = true;
    pausePreview();
    setPendingPlate(motor.plat, motor);

    if (sudahIsiHariIni(motor.plat)) {
      filledOpen = true;
      return;
    }

    go('bbm');
  }

  function submitResult(): void {
    if (!analysisValid) return;

    resultOpen = false;
    void resolvePlate(analysisPlate);
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

  /**
   * Plat belum terdaftar: langsung daftarkan otomatis (tanpa mengisi nama
   * pelanggan) supaya operator cepat lanjut ke pemilihan BBM.
   */
  async function registerVehicle(plat: string): Promise<Motor> {
    const fallback: Motor = {
      plat,
      nama: 'Tanpa nama',
      jenis: analysis?.color ? `Motor ${analysis.color}` : 'Motor',
      ...(analysis?.color ? { warna: analysis.color } : {}),
      ...(analysis?.year ? { berlakuTahun: analysis.year } : {}),
      ...(analysis?.month ? { berlakuBulan: analysis.month } : {}),
    };

    try {
      const created = await repo.createMotor(fallback);
      pushToast(`Kendaraan ${formatPlat(created.plat)} didaftarkan otomatis.`, 'success');
      return created;
    } catch {
      pushToast('Kendaraan gagal disimpan, lanjut tanpa data kendaraan.', 'error');
      return fallback;
    }
  }

  /** "Scan Ulang": tutup dialog & kembali ke preview kamera. */
  function rescan(): void {
    resultOpen = false;
    manualOpen = false;
    filledOpen = false;
    manualError = '';
    pendingPlat = '';
    analysis = null;
    analysisPlate = '';
    errorMessage = '';
    autoCandidates = [];
    autoProgress = 0;
    trigger.reset();
  }

  /** "Batal": batalkan proses scan dan keluar ke beranda. */
  function cancelScan(): void {
    leaving = true;
    resultOpen = false;
    manualOpen = false;
    filledOpen = false;
    pausePreview();
    resetFlow();
    go('beranda');
  }
</script>

<AppShell {current} {onnavigate}>
  <div class="space-y-3">
    {#if !online}
      <div class="card border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
        Tidak ada koneksi internet. Pembacaan plat memerlukan server AI — gunakan input manual.
      </div>
    {/if}

    <div class="relative overflow-hidden rounded-[var(--radius-card)] bg-ink">
      <video
        bind:this={video}
        class="h-[52vh] max-h-[460px] w-full object-cover md:h-[58vh]"
        autoplay
        playsinline
        muted
      ></video>

      {#if camera === 'ready'}
        <ScanOverlay active={!processing && !autoActive} />
      {/if}

      {#if autoActive}
        {#each autoCandidates.slice(0, 1) as box, index (index)}
          <div
            class="pointer-events-none absolute rounded-md border-[3px] border-tertiary"
            style="left: {box.x * 100}%; top: {box.y * 100}%; width: {box.width * 100}%; height: {box.height * 100}%;"
            aria-hidden="true"
          ></div>
        {/each}
      {/if}

      {#if processing}
        <div class="absolute inset-0 grid place-items-center bg-ink/70 p-6 text-center text-white">
          <div class="space-y-2">
            <p class="text-sm font-semibold">Memproses…</p>
            <p class="text-xs text-white/70">{progress}</p>
          </div>
        </div>
      {:else if camera !== 'ready'}
        <div class="absolute inset-0 grid place-items-center bg-ink/85 p-6 text-center text-white">
          <div class="space-y-2">
            <p class="text-lg font-bold">
              {camera === 'requesting'
                ? 'Menyiapkan kamera…'
                : camera === 'paused'
                  ? 'Kamera dijeda'
                  : camera === 'denied'
                    ? 'Izin kamera ditolak'
                    : 'Kamera tidak tersedia'}
            </p>
            <p class="mx-auto max-w-xs text-sm text-white/70">
              {camera === 'paused'
                ? 'Selesaikan atau tutup dialog untuk melanjutkan.'
                : errorMessage !== ''
                  ? errorMessage
                  : 'Arahkan kamera ke plat, lalu tekan Ambil Gambar.'}
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" size="md" onclick={() => (manualOpen = true)}>
                Input Manual
              </Button>
              {#if camera === 'unavailable' || camera === 'denied'}
                <Button variant="ghost" size="md" onclick={() => void startCamera()}>
                  Coba Kamera
                </Button>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="card flex items-center justify-between gap-3 px-4 py-3">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-ink">Auto Scan</p>
        <p class="text-xs text-muted">
          {autoStatus}{autoActive ? ` · percobaan ${autoAttempts}/${AUTO_MAX_UPLOADS}` : ''}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={autoActive}
        aria-label="Aktifkan Auto Scan"
        onclick={() => setAuto(!autoActive)}
        class="relative h-8 w-14 shrink-0 rounded-full border-[1.5px] transition-colors"
        class:border-primary={autoActive}
        class:bg-primary={autoActive}
        class:border-line={!autoActive}
        class:bg-bg={!autoActive}
      >
        <span
          class="absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left]"
          class:left-0.5={!autoActive}
          class:left-6={autoActive}
        ></span>
      </button>
    </div>

    {#if errorMessage !== '' && !processing}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
        {errorMessage}
      </p>
    {/if}

    <Button size="lg" full disabled={camera !== 'ready' || processing} loading={processing} onclick={() => void capture()}>
      Ambil Gambar
    </Button>

    <div class="grid grid-cols-2 gap-2">
      <Button variant="secondary" onclick={() => (manualOpen = true)}>Input Manual</Button>
      <Button variant="ghost" onclick={cancelScan}>Batal</Button>
    </div>

    <p class="text-center text-xs text-muted">
      Foto dikirim ke server AI untuk dibaca plat dan warnanya. Maksimal 1 MB setelah kompresi.
    </p>
  </div>
</AppShell>

<Dialog
  bind:open={resultOpen}
  title="Hasil Pembacaan"
  description="Periksa hasil AI. Betulkan plat bila ada karakter yang salah."
>
  <div class="space-y-3">
    <div class="card space-y-2 px-4 py-3 text-center">
      <p class="plate text-2xl">{analysisPreview || '—'}</p>
      <div class="flex flex-wrap justify-center gap-1.5">
        {#if analysis?.color}
          <Badge tone="info">Warna: {analysis.color}</Badge>
        {/if}
        {#if analysis?.month || analysis?.year}
          <Badge tone="neutral">Berlaku {analysis.month ?? '--'}/{analysis.year ?? '----'}</Badge>
        {/if}
        {#if !analysis?.color}
          <Badge tone="warning">Warna tidak terbaca</Badge>
        {/if}
      </div>
    </div>

    <input
      class="field plate text-center text-xl uppercase"
      bind:value={analysisPlate}
      placeholder="B 1234 ABC"
      inputmode="text"
      autocomplete="off"
      autocapitalize="characters"
      autocorrect="off"
      spellcheck="false"
      enterkeyhint="go"
      aria-label="Perbaiki nomor plat"
      oninput={() => (analysisPlate = analysisPlate.toUpperCase())}
      onkeydown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitResult();
        }
      }}
    />

    {#if !analysisValid}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
        Nomor plat belum valid. Contoh: B 1234 ABC.
      </p>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="secondary" onclick={rescan}>Scan Ulang</Button>
    <Button variant="ghost" onclick={cancelScan}>Batal</Button>
    <Button disabled={!analysisValid} onclick={submitResult}>Lanjut</Button>
  {/snippet}
</Dialog>

<Dialog
  bind:open={manualOpen}
  title="Masukkan Nomor Plat"
  description="Server AI tidak bisa membaca plat. Ketik manual menggunakan keyboard perangkat."
>
  <div class="space-y-3">
    <input
      class="field plate text-center text-xl uppercase"
      bind:value={manualPlat}
      placeholder="B 1234 ABC"
      inputmode="text"
      autocomplete="off"
      autocapitalize="characters"
      autocorrect="off"
      spellcheck="false"
      enterkeyhint="go"
      aria-label="Nomor plat"
      oninput={() => {
        manualPlat = manualPlat.toUpperCase();
        manualError = '';
      }}
      onkeydown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitManual();
        }
      }}
    />

    <p class="text-center font-mono text-sm text-muted">{manualPreview || '—'}</p>

    {#if manualError !== ''}
      <p class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
        {manualError}
      </p>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="secondary" onclick={rescan}>Scan Ulang</Button>
    <Button variant="ghost" onclick={cancelScan}>Batal</Button>
    <Button onclick={submitManual}>Lanjut</Button>
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
    <Button variant="secondary" onclick={rescan}>Scan Ulang</Button>
    <Button variant="ghost" onclick={cancelScan}>Batal</Button>
    <Button
      onclick={() => {
        leaving = true;
        filledOpen = false;
        go('bbm');
      }}>Lanjut (Pelangsir)</Button
    >
  {/snippet}
</Dialog>
