(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ==========================================
  // 1. RESPONSIVE MOBILE NAVIGATION
  // ==========================================

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  function setMenuOpen(open) {
    if (!navToggle || !navLinks) return;

    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
    navLinks.classList.toggle("is-open", open);
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    // Close after selecting a navigation link.
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    // Close with Escape.
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      const wasOpen = navToggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(false);

      if (wasOpen) navToggle.focus();
    });

    // Close when clicking outside the menu.
    document.addEventListener("click", (event) => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";

      if (
        isOpen &&
        !navToggle.contains(event.target) &&
        !navLinks.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    });

    // Reset the menu when crossing the mobile breakpoint.
    const handleBreakpointChange = () => setMenuOpen(false);

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", handleBreakpointChange);
    } else {
      mobileQuery.addListener(handleBreakpointChange);
    }
  }

  // ==========================================
  // 2. AUTOMATIC COPYRIGHT YEAR
  // ==========================================

  const yearNode = document.getElementById("copyright-year");

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  // ==========================================
  // 3. ACTIVE NAV LINK (SCROLLSPY)
  // ==========================================

  if ("IntersectionObserver" in window) {
    const spyLinks = document.querySelectorAll(".nav-links a[href^='#']");
    const spySections = document.querySelectorAll("main section[id]");

    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          spyLinks.forEach((link) => {
            if (link.getAttribute("href") === "#" + entry.target.id) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    spySections.forEach((section) => spyObserver.observe(section));
  }

  // ==========================================
  // 4. SCROLL REVEAL ANIMATION
  // ==========================================

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealTargets = document.querySelectorAll(
      ".about-text, .about-card, .skill-box, .project-card, .contact-info-box",
    );

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    revealTargets.forEach((el, index) => {
      el.classList.add("reveal");
      // Siblings ek ke baad ek aayein (chhota stagger)
      el.style.transitionDelay = `${(index % 4) * 70}ms`;
      revealObserver.observe(el);
    });
  }

  // ==========================================
  // 5. THREE.JS BACKGROUND (LAZY-LOADED)
  // ==========================================

  const THREE_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  const container = document.getElementById("canvas-container");

  let renderer = null;
  let scene = null;
  let camera = null;

  let icosahedron = null;
  let torus = null;
  let clock = null;

  let animationId = 0;
  let lastFrameTime = 0;
  let isPageVisible = !document.hidden;

  let mouseX = 0;
  let mouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  let lastWidth = window.innerWidth;
  let resizeFrame = 0;

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = 0;
    }
  }

  function renderStaticFrame() {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function animate(timestamp) {
    animationId = 0;

    if (
      !renderer ||
      !scene ||
      !camera ||
      !isPageVisible ||
      reduceMotion.matches
    ) {
      renderStaticFrame();
      return;
    }

    // Limit animation to approximately 30 FPS.
    if (timestamp - lastFrameTime < 33) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    lastFrameTime = timestamp;

    // Smooth mouse interaction.
    currentMouseX += (mouseX - currentMouseX) * 0.04;
    currentMouseY += (mouseY - currentMouseY) * 0.04;

    const elapsed = clock.getElapsedTime();

    const desiredX = currentMouseY * 0.3;
    const desiredY = currentMouseX * 0.3;

    // Icosahedron rotation.
    icosahedron.rotation.x += (desiredX - icosahedron.rotation.x) * 0.035;
    icosahedron.rotation.y +=
      (elapsed * 0.15 + desiredY - icosahedron.rotation.y) * 0.035;

    // Torus rotation.
    torus.rotation.x += (elapsed * 0.08 - torus.rotation.x) * 0.025;
    torus.rotation.y += (elapsed * -0.1 + desiredX - torus.rotation.y) * 0.025;

    renderer.render(scene, camera);

    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!renderer || !isPageVisible || reduceMotion.matches || animationId) {
      renderStaticFrame();
      return;
    }

    lastFrameTime = 0;
    animationId = requestAnimationFrame(animate);
  }

  function handleMotionPreference() {
    stopAnimation();

    if (reduceMotion.matches) {
      renderStaticFrame();
    } else {
      startAnimation();
    }
  }

  // Resize: sirf width badalne par, aur requestAnimationFrame se throttle.
  // (Mobile par address bar hide/show hone se height badalti hai, wahan skip.)
  function handleResize() {
    if (!renderer || !camera) return;
    if (window.innerWidth === lastWidth) return;
    if (resizeFrame) return;

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      lastWidth = window.innerWidth;

      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderStaticFrame();
    });
  }

  function initBackground() {
    if (!container || !window.THREE || renderer) return;

    try {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / Math.max(window.innerHeight, 1),
        0.1,
        1000,
      );
      camera.position.z = 8;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio <= 1.5,
        powerPreference: "low-power",
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // Wireframe icosahedron.
      icosahedron = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.5, 0),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
        }),
      );
      scene.add(icosahedron);

      // Wireframe torus.
      torus = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.8, 12, 72),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.06,
        }),
      );
      scene.add(torus);

      clock = new THREE.Clock();

      // Mouse interaction: sirf un devices par jahan hover hota hai.
      if (window.matchMedia("(hover: hover)").matches) {
        window.addEventListener(
          "mousemove",
          (event) => {
            mouseX = (event.clientX / window.innerWidth - 0.5) * 0.8;
            mouseY = (event.clientY / window.innerHeight - 0.5) * 0.8;
          },
          { passive: true },
        );
      }

      // Responsive canvas.
      window.addEventListener("resize", handleResize, { passive: true });

      // Pause animation while the tab is hidden.
      document.addEventListener("visibilitychange", () => {
        isPageVisible = !document.hidden;

        if (isPageVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });

      // Respect the operating system motion preference.
      if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener("change", handleMotionPreference);
      } else {
        reduceMotion.addListener(handleMotionPreference);
      }

      // WebGL context lost/restored (GPU reset, low memory, etc.).
      renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        stopAnimation();
      });

      renderer.domElement.addEventListener("webglcontextrestored", () => {
        handleMotionPreference();
      });

      handleMotionPreference();

      // Smooth fade-in.
      requestAnimationFrame(() => container.classList.add("is-ready"));
    } catch (error) {
      // Keep the website usable if WebGL is unavailable.
      console.warn("3D background could not be initialized:", error);

      stopAnimation();

      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }

      renderer = null;
    }
  }

  function loadThree() {
    const script = document.createElement("script");
    script.src = THREE_URL;
    script.async = true;
    script.onload = initBackground;
    script.onerror = () => {
      console.warn("Three.js could not be loaded; continuing without 3D.");
    };
    document.head.appendChild(script);
  }

  function scheduleThree() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadThree, { timeout: 2500 });
    } else {
      setTimeout(loadThree, 1500);
    }
  }

  // Heavy library sirf tab load karo jab zaroori ho:
  // - reduced motion off ho
  // - Data Saver off ho
  // - screen chhoti (phone) na ho
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const isSmallScreen = window.innerWidth <= 600;

  if (container && !reduceMotion.matches && !saveData && !isSmallScreen) {
    if (document.readyState === "complete") {
      scheduleThree();
    } else {
      window.addEventListener("load", scheduleThree, { once: true });
    }
  }
})();
