<template>
  <div class="h-100 d-flex align-center justify-space-between text-medium-emphasis">
    <!-- 👉 Footer: left content -->
    <span>
      &copy;
      {{ new Date().getFullYear() }}
      DEALS & <RouterLink
        to="/license"
        style="color: rgba(46, 38, 61, 70%)"
      >All Rights Reserved</RouterLink> by <a
        href="https://pancaran-group.co.id"
        target="_blank"
        rel="noopener noreferrer"
      >Pancaran Group</a>
    </span>
  </div>
</template>
