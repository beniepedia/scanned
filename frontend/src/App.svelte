<script lang="ts">
  import { router, go } from '$lib/router.svelte';
  import { session } from '$lib/stores/session.svelte';
  import { flow } from '$lib/stores/flow.svelte';
  import Login from './pages/Login.svelte';
  import Beranda from './pages/Beranda.svelte';
  import Scan from './pages/Scan.svelte';
  import Bbm from './pages/Bbm.svelte';
  import Sukses from './pages/Sukses.svelte';
  import Riwayat from './pages/Riwayat.svelte';
  import { pushToast } from '$lib/stores/toast.svelte';

  let lastErrorAt = 0;

  function errorMessage(reason: unknown): string {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === 'string') return reason;
    return 'Kesalahan tak terduga pada antarmuka.';
  }

  // Jangan biarkan error tak tertangkap berujung layar putih.
  function reportError(event: unknown): void {
    const now = Date.now();
    if (now - lastErrorAt < 5000) return;

    lastErrorAt = now;
    const reason = event instanceof ErrorEvent ? (event.error ?? event.message) : event;
    pushToast(errorMessage(reason).slice(0, 140), 'error');
    console.error(reason);
  }

  $effect(() => {
    const loggedIn = session.operator !== null;

    if (!loggedIn && router.route !== 'login') {
      go('login');
      return;
    }

    if (loggedIn && router.route === 'login') {
      go('beranda');
      return;
    }

    if (router.route === 'bbm' && flow.plat === '') {
      go('scan');
      return;
    }

    if (router.route === 'sukses' && flow.last === null) {
      go('beranda');
    }
  });
</script>

<svelte:window
  onunhandledrejection={(event) => reportError(event.reason)}
  onerror={(event) => reportError(event)}
/>

{#if router.route === 'login'}
  <Login />
{:else if router.route === 'scan'}
  <Scan current={router.route} onnavigate={go} />
{:else if router.route === 'bbm'}
  <Bbm current={router.route} onnavigate={go} />
{:else if router.route === 'sukses'}
  <Sukses current={router.route} onnavigate={go} />
{:else if router.route === 'riwayat'}
  <Riwayat current={router.route} onnavigate={go} />
{:else}
  <Beranda current={router.route} onnavigate={go} />
{/if}
