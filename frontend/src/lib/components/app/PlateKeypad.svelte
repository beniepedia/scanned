<script lang="ts">
  interface Props {
    value: string;
    onchange: (value: string) => void;
  }

  let { value, onchange }: Props = $props();

  const regions = ['B', 'D', 'F', 'AB', 'N', 'L', 'W', 'AA'];
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function press(key: string): void {
    if (value.length >= 9) return;
    onchange((value + key).toUpperCase());
  }

  function remove(): void {
    onchange(value.slice(0, -1));
  }
</script>

<div class="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
  <div>
    <p class="field-label">Kode wilayah</p>
    <div class="flex flex-wrap gap-1.5">
      {#each regions as region (region)}
        <button
          type="button"
          onclick={() => press(region)}
          class="min-h-10 min-w-11 rounded-lg border-[1.5px] border-line bg-surface px-2 font-mono font-bold text-ink active:bg-bg"
        >
          {region}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <p class="field-label">Angka</p>
    <div class="grid grid-cols-5 gap-1.5">
      {#each digits as digit (digit)}
        <button
          type="button"
          onclick={() => press(digit)}
          class="min-h-11 rounded-lg border-[1.5px] border-line bg-surface text-lg font-bold text-ink active:bg-bg"
        >
          {digit}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <p class="field-label">Huruf</p>
    <div class="grid grid-cols-7 gap-1.5">
      {#each letters as letter (letter)}
        <button
          type="button"
          onclick={() => press(letter)}
          class="min-h-10 rounded-lg border-[1.5px] border-line bg-surface text-sm font-bold text-ink active:bg-bg"
        >
          {letter}
        </button>
      {/each}
      <button
        type="button"
        onclick={remove}
        class="col-span-2 min-h-10 rounded-lg border-[1.5px] border-line bg-bg text-sm font-bold text-muted"
        aria-label="Hapus satu karakter"
      >
        ⌫ Hapus
      </button>
      <button
        type="button"
        onclick={() => onchange('')}
        class="min-h-10 rounded-lg px-2 text-sm font-semibold text-muted"
      >
        Bersihkan
      </button>
    </div>
  </div>
</div>
