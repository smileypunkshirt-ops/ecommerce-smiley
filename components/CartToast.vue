<script setup lang="ts">
const { toast, close } = useCartToast();

const toastRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragX = ref(0);
const dragY = ref(0);
const startX = ref(0);
const startY = ref(0);

const resetDrag = () => {
  isDragging.value = false;
  dragX.value = 0;
  dragY.value = 0;
};

const onPointerDown = (event: PointerEvent) => {
  if (!toast.value.visible) return;
  if (event.button !== undefined && event.button !== 0) return;
  const target = toastRef.value;
  if (!target) return;
  isDragging.value = true;
  startX.value = event.clientX;
  startY.value = event.clientY;
  target.setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return;
  dragX.value = event.clientX - startX.value;
  dragY.value = event.clientY - startY.value;
};

const onPointerUp = (event: PointerEvent) => {
  if (!isDragging.value) return;
  const distance = Math.hypot(dragX.value, dragY.value);
  const target = toastRef.value;
  if (target) {
    target.releasePointerCapture(event.pointerId);
  }
  if (distance > 60) {
    close();
  }
  resetDrag();
};

watch(
  () => toast.value.id,
  () => {
    resetDrag();
  }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="toast.visible" class="cart-toast-wrap">
      <div
        ref="toastRef"
        class="cart-toast"
        :class="{ 'is-dragging': isDragging }"
        :style="{ transform: `translate(${dragX}px, ${dragY}px)` }"
        role="status"
        aria-live="polite"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="cart-toast-body">
          <p class="cart-toast-title">{{ toast.message }}</p>
          <p class="cart-toast-subtitle">Puedes revisar tu carrito cuando quieras.</p>
        </div>
        <div class="cart-toast-actions">
          <NuxtLink class="cart-toast-link" to="/cart">Ir al carrito</NuxtLink>
          <button class="cart-toast-close" type="button" @click="close">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
