<script>
  import { keyLayout } from '../lib/presets.js';

  export let requiredChar = '';

  const shiftMap = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
    '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
  };

  function getKeyCode(char) {
    if (!char) return '';
    const unshifted = shiftMap[char] || char;
    if (unshifted === ' ') return 'Space';
    if (unshifted === ';') return 'Semicolon';
    if (unshifted === ',') return 'Comma';
    if (unshifted === '.') return 'Period';
    if (unshifted === '/') return 'Slash';
    if (unshifted === '[') return 'BracketLeft';
    if (unshifted === ']') return 'BracketRight';
    if (unshifted === '\\') return 'Backslash';
    if (unshifted === '-') return 'Minus';
    if (unshifted === '=') return 'Equal';
    if (unshifted === "'") return 'Quote';
    if (unshifted === "`") return 'Backquote';
    if (unshifted === '\n') return 'Enter';
    if (unshifted.toUpperCase() >= 'A' && unshifted.toUpperCase() <= 'Z') return 'Key' + unshifted.toUpperCase();
    if (!isNaN(parseInt(unshifted))) return 'Digit' + unshifted;
    return '';
  }

  // Set of currently pressed physical keys
  let pressedCodes = {};

  function handleKeyDown(e) {
    // Add pressed key code to state
    pressedCodes[e.code] = true;
  }

  function handleKeyUp(e) {
    // Remove pressed key code from state
    delete pressedCodes[e.code];
    pressedCodes = { ...pressedCodes };
  }

  // Reactive computations for next key targets and hand indicators
  $: targetCode = getKeyCode(requiredChar);
  $: needsShift = requiredChar && /[A-Z!@#$%^&*()_+{}:"<>?]/.test(requiredChar);

  // Helper to determine finger name and color
  function getFingerDetails(classes) {
    if (classes.includes('f-pinky')) return { name: 'Pinky', color: 'var(--f-pinky)' };
    if (classes.includes('f-ring')) return { name: 'Ring', color: 'var(--f-ring)' };
    if (classes.includes('f-middle')) return { name: 'Middle', color: 'var(--f-middle)' };
    if (classes.includes('f-index')) return { name: 'Index', color: 'var(--f-index)' };
    if (classes.includes('f-thumb')) return { name: 'Thumb', color: 'var(--f-thumb)' };
    return { name: '', color: '' };
  }

  // Reactive hand indicator states
  let leftHandActive = false;
  let rightHandActive = false;
  let leftFingerName = '';
  let rightFingerName = '';
  let leftFingerColor = '';
  let rightFingerColor = '';

  $: {
    // Reset states
    leftHandActive = false;
    rightHandActive = false;
    leftFingerName = '';
    rightFingerName = '';
    leftFingerColor = '';
    rightFingerColor = '';

    if (targetCode) {
      if (targetCode === 'Space') {
        leftHandActive = true;
        rightHandActive = true;
        leftFingerName = 'Thumb';
        rightFingerName = 'Thumb';
        leftFingerColor = 'var(--f-thumb)';
        rightFingerColor = 'var(--f-thumb)';
      } else {
        // Find key in keyLayout to determine hand and finger
        let foundKey = null;
        for (const row of keyLayout) {
          const key = row.find(k => k[1] === targetCode);
          if (key) {
            foundKey = key;
            break;
          }
        }

        if (foundKey) {
          const [_, __, classes, hand] = foundKey;
          const details = getFingerDetails(classes);

          if (hand === 'L') {
            leftHandActive = true;
            leftFingerName = details.name;
            leftFingerColor = details.color;
          } else if (hand === 'R') {
            rightHandActive = true;
            rightFingerName = details.name;
            rightFingerColor = details.color;
          }
        }
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class="hand-indicators">
  <div class="hand" class:active={leftHandActive || (needsShift && !leftHandActive)}>
    ✋ Left <span style="color: {leftFingerColor}">{leftFingerName ? `: ${leftFingerName}` : ''}</span>
    {#if needsShift && !leftHandActive}
      <span style="color: var(--f-pinky)"> (Shift)</span>
    {/if}
  </div>
  <div class="hand" class:active={rightHandActive}>
    <span style="color: {rightFingerColor}">{rightFingerName ? `${rightFingerName} :` : ''}</span> Right ✋
  </div>
</div>

<div class="keyboard">
  {#each keyLayout as row}
    <div class="row">
      {#each row as [label, code, classes, hand]}
        <div
          class="key {classes}"
          class:active={pressedCodes[code]}
          class:target={code === targetCode || (code === 'ShiftLeft' && needsShift)}
          data-code={code}
          data-hand={hand}
        >
          {label}
        </div>
      {/each}
    </div>
  {/each}
</div>
