<script setup lang="ts">
import logoUrl from "~/assets/smileypunk_logo.png";

const props = withDefaults(
  defineProps<{
    itemCount?: number;
    cartLabel?: string;
    cartLink?: string | null;
    centered?: boolean;
  }>(),
  {
    cartLabel: "Carrito",
    cartLink: "/cart",
    centered: false
  }
);

const showCart = computed(() => !props.centered && typeof props.itemCount === "number");
</script>

<template>
  <header class="topbar app-header" :class="{ 'is-centered': centered }">
    <NuxtLink class="brand" to="/">
      <img class="brand-logo" :src="logoUrl" alt="Smiley Punk" />
    </NuxtLink>
    <NuxtLink v-if="showCart && cartLink" class="cart-pill" :to="cartLink">
      <span>{{ cartLabel }}</span>
      <strong>{{ itemCount }}</strong>
    </NuxtLink>
    <div v-else-if="showCart" class="cart-pill">
      <span>{{ cartLabel }}</span>
      <strong>{{ itemCount }}</strong>
    </div>
  </header>
</template>
