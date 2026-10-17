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
