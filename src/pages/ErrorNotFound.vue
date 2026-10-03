<template>
  <q-page class="no-encontrado">
    <main class="app-container no-encontrado__contenedor">
      <p class="text-eyebrow">Error 404</p>
      <h1 class="text-display no-encontrado__titulo">Esta página no existe</h1>
      <p class="no-encontrado__texto">
        El enlace que seguiste no lleva a ningún lado. Quizá el tema se movió o el enlace tiene un
        error.
      </p>
      <q-btn color="primary" unelevated no-caps label="Ver los temas" to="/" />
    </main>
  </q-page>
</template>

<style scoped lang="scss">
.no-encontrado {
  display: grid;
  place-items: center;
}

.no-encontrado__contenedor {
  text-align: center;
  max-width: 46ch;
  padding-top: 80px;
  padding-bottom: 96px;
}

.no-encontrado__titulo {
  font-size: clamp(1.7rem, 4.5vw, 2.3rem);
  margin: 8px 0 12px;
}

.no-encontrado__texto {
  margin: 0 0 26px;
  color: $app-text-muted;
  line-height: 1.65;
}
</style>
