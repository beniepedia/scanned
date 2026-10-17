<script lang="ts">
  import type { Snippet } from 'svelte';
  import BottomNav from './BottomNav.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { session } from '$lib/stores/session.svelte';
  import type { Route } from '$lib/types';

  interface Props {
    current: Route;
    onnavigate: (route: Route) => void;
    children: Snippet;
  }

  let { current, onnavigate, children }: Props = $props();
</script>

<div class="min-h-dvh md:pl-20">
  <header class="sticky top-0 z-30 border-b-[1.5px] border-line bg-bg/95 backdrop-blur">
    <div class="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
      <div>
        <p class="text-xl leading-none font-extrabold tracking-tight text-primary">SPBU SCAN</p>
        <p class="mt-1 text-xs text-muted">Pencatatan isi BBM motor</p>
      </div>

      {#if session.operator}
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-surface px-2.5 py-1 font-mono text-[11px] font-bold text-muted">
            Nozzle {session.operator.nozzle}
          </span>
          <span class="grid size-9 place-items-center rounded-full bg-primary text-sm font-extrabold text-white">
            {session.operator.nama.charAt(0).toUpperCase()}
          </span>
        </div>
      {/if}
    </div>
  </header>

  <main class="safe-bottom mx-auto w-full max-w-3xl px-4 pt-4 pb-28 md:pb-8">
    {@render children()}
  </main>

  <BottomNav {current} {onnavigate} />
  <Toast />
</div>
