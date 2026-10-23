(() => {
  "use strict";

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
      link.addEventListener("click", () => {
        setMenuOpen(false);
      });
    });

    // Close with Escape.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const wasOpen = navToggle.getAttribute("aria-expanded") === "true";

        setMenuOpen(false);

        if (wasOpen) {
          navToggle.focus();
        }
      }
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
    const handleBreakpointChange = () => {
      setMenuOpen(false);
    };

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
  // 3. OPTIMIZED THREE.JS BACKGROUND
  // ==========================================

  const container = document.getElementById("canvas-container");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

  function handleResize() {
    if (!renderer || !camera) return;

    camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);

    camera.updateProjectionMatrix();

    // Limit high-DPI rendering cost.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderStaticFrame();
  }

  if (container && window.THREE) {
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

      // Mouse interaction.
      window.addEventListener(
        "mousemove",
        (event) => {
          mouseX = (event.clientX / window.innerWidth - 0.5) * 0.8;

          mouseY = (event.clientY / window.innerHeight - 0.5) * 0.8;
        },
        { passive: true },
      );

      // Responsive canvas.
      window.addEventListener("resize", handleResize, {
        passive: true,
      });

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

      handleMotionPreference();
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
})();
