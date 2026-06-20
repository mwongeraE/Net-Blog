(function () {
  'use strict';

  const rockets = [];
  const ROCKET_SIZE = 150;
  const MAX_SPEED = 2.5;
  const SCARED_MAX_SPEED = 12;
  const MIN_SPEED = 0.4;
  const CHANGE_INTERVAL = 120;
  const AVOID_DISTANCE = 300;
  const SCARE_RADIUS = 250;
  const SCARE_FORCE = 0.6;

  let mouseX = -9999;
  let mouseY = -9999;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createRocket(element) {
    const rect = element.getBoundingClientRect();
    return {
      el: element,
      x: random(50, window.innerWidth - 50),
      y: window.innerHeight + 100,
      vx: random(-0.8, 0.8),
      vy: random(-1.5, -0.4),
      targetVx: 0,
      targetVy: 0,
      angle: 0,
      changeTimer: Math.floor(random(0, CHANGE_INTERVAL)),
      phase: random(0, Math.PI * 2),
      scared: 0, // frames remaining in scared state
    };
  }

  function updateRocket(r, idx, time) {
    // ── Mouse scare logic ──
    const dx = r.x - mouseX;
    const dy = r.y - mouseY;
    const distToMouse = Math.sqrt(dx * dx + dy * dy);
    const isScared = distToMouse < SCARE_RADIUS;

    if (isScared) {
      r.scared = 30; // stay scared for ~30 frames
    }
    if (r.scared > 0) {
      r.scared--;
    }

    const effectiveMaxSpeed = r.scared > 0 ? SCARED_MAX_SPEED : MAX_SPEED;

    r.changeTimer--;

    if (r.changeTimer <= 0) {
      r.targetVx = random(-effectiveMaxSpeed, effectiveMaxSpeed);
      r.targetVy = random(-effectiveMaxSpeed, -MIN_SPEED);
      r.changeTimer = Math.floor(random(60, CHANGE_INTERVAL));
    }

    // Smooth velocity transitions
    const smoothFactor = r.scared > 0 ? 0.08 : 0.02;
    r.vx += (r.targetVx - r.vx) * smoothFactor;
    r.vy += (r.targetVy - r.vy) * smoothFactor;

    // Subtle sine wave wobble for organic feel
    r.vx += Math.sin(time * 0.002 + r.phase) * 0.04;
    r.vy += Math.cos(time * 0.003 + r.phase + 1) * 0.03;

    // ── Repulsion from mouse when scared ──
    if (r.scared > 0 && distToMouse > 0) {
      const repulsion = SCARE_FORCE * (SCARE_RADIUS - distToMouse) / SCARE_RADIUS;
      r.vx += (dx / distToMouse) * repulsion;
      r.vy += (dy / distToMouse) * repulsion;
    }

    // Collision avoidance between rockets
    for (let i = 0; i < rockets.length; i++) {
      if (i === idx) continue;
      const other = rockets[i];
      const ddx = r.x - other.x;
      const ddy = r.y - other.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < AVOID_DISTANCE && dist > 0) {
        const force = (AVOID_DISTANCE - dist) / AVOID_DISTANCE * 0.5;
        r.vx += (ddx / dist) * force;
        r.vy += (ddy / dist) * force;
      }
    }

    // Clamp speed
    const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
    if (speed > effectiveMaxSpeed) {
      r.vx = (r.vx / speed) * effectiveMaxSpeed;
      r.vy = (r.vy / speed) * effectiveMaxSpeed;
    }

    r.x += r.vx;
    r.y += r.vy;

    // Calculate angle based on direction
    r.angle = Math.atan2(r.vy, r.vx) * (180 / Math.PI) + 90;

    // Apply position and rotation
    r.el.style.transform = `translate(${r.x}px, ${r.y}px) rotate(${r.angle}deg)`;

    // Reset to bottom when off the top of the screen
    if (r.y < -200) {
      r.x = random(50, window.innerWidth - 50);
      r.y = window.innerHeight + random(50, 200);
      r.vx = random(-0.8, 0.8);
      r.vy = random(-1.5, -0.4);
      r.targetVx = random(-effectiveMaxSpeed, effectiveMaxSpeed);
      r.targetVy = random(-effectiveMaxSpeed, -MIN_SPEED);
      r.changeTimer = Math.floor(random(60, CHANGE_INTERVAL));
      r.scared = 0;
    }
  }

  function init() {
    const elements = document.querySelectorAll('.floating-rocket');
    if (!elements.length) return;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Reset mouse when leaving the window
    document.addEventListener('mouseleave', () => {
      mouseX = -9999;
      mouseY = -9999;
    });

    elements.forEach((el) => {
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = '5';
      el.style.pointerEvents = 'none';
      el.style.userSelect = 'none';
      el.style.willChange = 'transform';
      rockets.push(createRocket(el));
    });

    let time = 0;
    function animate() {
      time++;
      for (let i = 0; i < rockets.length; i++) {
        updateRocket(rockets[i], i, time);
      }
      requestAnimationFrame(animate);
    }

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
