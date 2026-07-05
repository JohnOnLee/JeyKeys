<script>
  import { toastStore } from '../lib/toastStore.js';
</script>

<div id="toast" class="toast" class:show={$toastStore.show}>
  {$toastStore.message}
</div>
