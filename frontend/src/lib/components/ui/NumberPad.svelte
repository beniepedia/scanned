<script lang="ts">
  interface Props {
    value: string;
    onchange: (value: string) => void;
    presets?: number[];
    max?: number;
  }

  let { value, onchange, presets = [1, 2, 3, 5], max = 100 }: Props = $props();

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  function press(key: string): void {
    let next: string;

    if (key === 'del') {
      next = value.slice(0, -1);
    } else if (key === '.') {
      next = value === '' ? '0.' : value.includes('.') ? value : `${value}.`;
    } else {
      next = (value + key).replace(/^0+(?=\d)/, '');
    }

    if (next !== '' && Number(next) > max) return;
    if (/\.\d{2,}$/.test(next)) return;

    onchange(next);
  }
</script>

<div>
  <div class="grid grid-cols-3 gap-2">
    {#each digits as key (key)}
      <button
        type="button"
        onclick={() => press(key)}
        class="min-h-13 rounded-[var(--radius-card)] border-[1.5px] border-line bg-surface text-lg font-bold text-ink active:bg-bg"
        aria-label={key === 'del' ? 'Hapus satu digit' : `Angka ${key}`}
      >
        {key === 'del' ? '⌫' : key}
      </button>
    {/each}
  </div>

  <div class="mt-2 flex gap-2">
    {#each presets as preset (preset)}
      <button
        type="button"
        onclick={() => onchange(String(preset))}
        class="min-h-11 flex-1 rounded-[var(--radius-card)] border-[1.5px] border-line bg-surface text-sm font-semibold text-muted active:bg-bg"
      >
        {preset} L
      </button>
    {/each}
    <button
      type="button"
      onclick={() => onchange('')}
      class="min-h-11 rounded-[var(--radius-card)] px-3 text-sm font-semibold text-muted"
    >
      Reset
    </button>
  </div>
</div>
