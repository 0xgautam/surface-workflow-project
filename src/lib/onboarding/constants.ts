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

export const SNIPPET_TEMPLATE = `<script>
  !(function () {
    var a = (window.analytics = window.analytics || []);
    if (!a.initialize)
      if (a.invoked)
        window.console &&
          console.error &&
          console.error("Surface snippet included twice.");
      else {
        a.invoked = !0;
        a.methods = ["track", "page", "identify", "ready"];
        a.factory = function (e) {
          return function () {
            var t = Array.prototype.slice.call(arguments);
            t.unshift(e);
            a.push(t);
            return a;
          };
        };
        for (var e = 0; e < a.methods.length; e++) {
          var t = a.methods[e];
          a[t] = a.factory(t);
        }
        a.load = function (e) {
          a._writeKey = e;
          var t = document.createElement("script");
          t.async = !0;
          t.src = "/surface_analytics.js";
          var n = document.getElementsByTagName("script")[0];
          n.parentNode.insertBefore(t, n);
        };
        a.SNIPPET_VERSION = "1.0.0";
        a.load("{{API_KEY}}");
        a.page();
      }
  })();
</script>`;
