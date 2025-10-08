export const ONBOARDING_STEPS = [
  {
    id: "install-tag",
    title: "Install the Surface Tag",
    description: "Enable tracking and analytics.",
  },
  {
    id: "test-events",
    title: "Test Surface Tag Events",
    description: "Test if the Surface Tag is properly emitting events.",
  },
] as const;

// Updated snippet template
export const SNIPPET_TEMPLATE = `<!-- Surface Analytics Tag -->
<script>
  (function(w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({
      'surface.start': new Date().getTime(),
      event: 'surface.js'
    });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'surface' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.surface-analytics.com/tag.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'surface', '{{API_KEY}}');
</script>`;

// For local development
export const SNIPPET_TEMPLATE_DEV = `<!-- Surface Analytics Tag (Development) -->
<script>
  (function(w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({
      'surface.start': new Date().getTime(),
      event: 'surface.js'
    });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'surface' ? '&l=' + l : '';
    j.async = true;
    j.src = 'http://localhost:3000/tag.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'surface', '{{API_KEY}}');
</script>`;
