<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props {
    label?: string;
    value?: string;
    type?: 'text' | 'password' | 'search';
    placeholder?: string;
    inputmode?: 'text' | 'numeric' | 'decimal';
    autocomplete?: HTMLInputAttributes['autocomplete'];
    maxlength?: number;
    disabled?: boolean;
    error?: string;
    hint?: string;
    id?: string;
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
  }

  let {
    label,
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    inputmode = 'text',
    autocomplete = 'off',
    maxlength,
    disabled = false,
    error = '',
    hint = '',
    id = `input-${Math.random().toString(36).slice(2, 9)}`,
    oninput,
  }: Props = $props();

  let describedBy = $derived(
    [error !== '' ? `${id}-error` : '', hint !== '' ? `${id}-hint` : ''].filter(Boolean).join(' ')
  );
</script>

<div>
  {#if label}
    <label class="field-label" for={id}>{label}</label>
  {/if}

  <input
    {id}
    {type}
    {placeholder}
    {inputmode}
    {autocomplete}
    {maxlength}
    {disabled}
    {oninput}
    bind:value
    class="field"
    class:border-danger={error !== ''}
    aria-invalid={error !== ''}
    aria-describedby={describedBy === '' ? undefined : describedBy}
  />

  {#if hint !== ''}
    <p id="{id}-hint" class="mt-1 text-xs text-muted">{hint}</p>
  {/if}

  {#if error !== ''}
    <p id="{id}-error" class="mt-1 text-xs font-medium text-danger-ink" role="alert">{error}</p>
  {/if}
</div>
