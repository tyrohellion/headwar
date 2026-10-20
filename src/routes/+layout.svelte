<script>
  import favicon from "$lib/assets/favicon.svg";
  import Navbar from "$lib/components/navbar.svelte";
  import "@awesome.me/webawesome/dist/styles/webawesome.css";
  import Footer from "$lib/components/footer.svelte";
  import "@fontsource-variable/inter/wght.css";
  import "@fontsource-variable/jetbrains-mono/wght.css";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>headwar</title>
</svelte:head>

<div class="app-layout">
  <Navbar />

  <main class="main">
    {@render children()}
  </main>

  <Footer />
</div>

<style>
  :root {
    --wa-font-family-body: "Inter Variable", system-ui, sans-serif;
    --wa-font-family-heading: "Inter Variable", system-ui, sans-serif;
    --wa-font-family-longform: "Inter Variable", system-ui, sans-serif;
    --wa-font-family-code: "JetBrains Mono Variable", monospace;
    --font-mono: "JetBrains Mono Variable", monospace;
  }

  :global(html.wa-dark) {
    /* Every brand colour in dark mode uses the reference site's blue, the
       same one the hero wordmark is set in. The "loud" fill is the
       reference's own accent with its dark text colour, exactly like the
       Install button over there. */
    --wa-color-brand-fill-loud: #8ab9f3;
    --wa-color-brand-on-loud: #003259;

    --wa-color-brand-fill-normal: #08497c;
    --wa-color-brand-on-normal: #d2e4ff;

    --wa-color-brand-fill-quiet: #0c2b46;
    --wa-color-brand-on-quiet: #8ab9f3;

    --wa-color-brand-border-quiet: #0b3456;
    --wa-color-brand-border-normal: #08497c;
    --wa-color-brand-border-loud: #8ab9f3;

    /* The numbered aliases the site reaches for. */
    --wa-color-brand-50: #4981b8;
    --wa-color-brand-text-default: #8ab9f3;
    --wa-color-brand-rgb: 139, 185, 243;

    --wa-color-text-link: #8ab9f3;
    --wa-color-focus: #8ab9f3;
  }

  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .main {
    width: 100%;
    box-sizing: border-box;
    padding: 2.5rem 2rem 8rem 2rem;
    flex: 1 0 auto;
    min-height: 100vh;
  }

  /* Firefox only: standard scrollbar properties. These must NOT apply in
     Chrome/Edge/Safari — setting scrollbar-width/scrollbar-color on an element
     makes Blink ignore the ::-webkit-scrollbar pseudo-element styling for it
     (which is what removes the arrow buttons). */
  @supports (-moz-appearance: none) {
    :global(*) {
      scrollbar-width: thin;
      scrollbar-color: color-mix(
          in srgb,
          var(--wa-color-text-quiet) 40%,
          transparent
        )
        transparent;
    }
  }

  :global(*::-webkit-scrollbar) {
    width: 4px;
    height: 4px;
  }

  :global(*::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(*::-webkit-scrollbar-button) {
    display: none;
  }

  :global(*::-webkit-scrollbar-corner) {
    background: transparent;
  }

  :global(*::-webkit-scrollbar-thumb) {
    background: color-mix(in srgb, var(--wa-color-text-quiet) 40%, transparent);
    border-radius: 999px;
  }

  :global(*::-webkit-scrollbar-thumb:hover) {
    background: color-mix(in srgb, var(--wa-color-text-quiet) 70%, transparent);
  }

  @media (max-width: 480px) {
    :global(*:hover),
    :global(*:active) {
      transform: none !important;
    }
  }

  @media (max-width: 768px) {
    .main {
      padding: 1.5rem 1rem 8rem 1rem;
    }
  }
</style>
