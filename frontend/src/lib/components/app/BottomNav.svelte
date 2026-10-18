<script lang="ts">
  import type { Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
  }

  let { current, onnavigate }: Props = $props();
</script>

<!-- Mobile / tablet portrait: bottom bar with scan FAB in the middle -->
<nav
  class="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-line bg-surface md:hidden"
  aria-label="Navigasi utama"
>
  <div class="relative mx-auto flex max-w-3xl items-end justify-between px-6 pt-2 pb-1">
    <button
      type="button"
      class="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5"
      aria-current={current === 'beranda' ? 'page' : undefined}
      onclick={() => onnavigate('beranda')}
    >
      <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
          class={current === 'beranda' ? 'text-primary' : 'text-muted'}
        />
      </svg>
      <span class={current === 'beranda' ? 'text-[11px] font-bold text-primary' : 'text-[11px] text-muted'}
        >Beranda</span
      >
    </button>

    <div class="w-16" aria-hidden="true"></div>

    <button
      type="button"
      class="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5"
      aria-current={current === 'riwayat' ? 'page' : undefined}
      onclick={() => onnavigate('riwayat')}
    >
      <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 7v5l3 2m6-2a9 9 0 1 1-3.2-6.9M21 4v4h-4"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          class={current === 'riwayat' ? 'text-primary' : 'text-muted'}
        />
      </svg>
      <span class={current === 'riwayat' ? 'text-[11px] font-bold text-primary' : 'text-[11px] text-muted'}
        >Riwayat</span
      >
    </button>

    <button
      type="button"
      onclick={() => onnavigate('scan')}
      class="absolute -top-7 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-4 border-bg bg-primary text-white shadow-lg active:scale-95"
      aria-label="Scan plat nomor"
    >
      <svg class="size-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8" />
      </svg>
    </button>
  </div>
</nav>

<!-- Tablet landscape / desktop: left rail -->
<nav
  class="fixed top-0 left-0 z-40 hidden h-dvh w-20 flex-col items-center gap-2 border-r-[1.5px] border-line bg-surface py-6 md:flex"
  aria-label="Navigasi utama"
>
  <span class="mb-3 text-[10px] font-extrabold tracking-widest text-primary">ANPR</span>

  <button
    type="button"
    class="grid size-12 place-items-center rounded-xl"
    class:bg-primary-soft={current === 'beranda'}
    aria-current={current === 'beranda' ? 'page' : undefined}
    aria-label="Beranda"
    onclick={() => onnavigate('beranda')}
  >
    <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
        class={current === 'beranda' ? 'text-primary' : 'text-muted'}
      />
    </svg>
  </button>

  <button
    type="button"
    class="grid size-12 place-items-center rounded-xl"
    class:bg-primary-soft={current === 'riwayat'}
    aria-current={current === 'riwayat' ? 'page' : undefined}
    aria-label="Riwayat"
    onclick={() => onnavigate('riwayat')}
  >
    <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 7v5l3 2m6-2a9 9 0 1 1-3.2-6.9M21 4v4h-4"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={current === 'riwayat' ? 'text-primary' : 'text-muted'}
      />
    </svg>
  </button>

  <button
    type="button"
    onclick={() => onnavigate('scan')}
    class="my-2 grid size-14 place-items-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark"
    aria-label="Scan plat nomor"
  >
    <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8" />
    </svg>
  </button>
</nav>
