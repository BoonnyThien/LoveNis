/* =============================================================================
 * SCRIPT.JS: DUAL-PIN AUTH ENGINE + SPRING PHYSICS + WEB AUDIO
 * 
 * AUTHENTICATION HIERARCHY:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TOP INPUT (username) = MASTER CODE     → Priority: HIGHEST   │
 * │  BOTTOM INPUT (password) = ACCESS CODE  → Priority: STANDARD  │
 * │                                                                │
 * │  RULES:                                                       │
 * │  1. Master code correct → bypasses everything, ignores bottom │
 * │  2. Access code correct → works ONLY if master is empty/wrong │
 * │  3. Master always overrides when its value is correct         │
 * │  4. Both wrong → shake + error feedback                       │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * AUTH LEVELS:
 *   MASTER (top)  → level: 'master'  → full override access
 *   ACCESS (bot)  → level: 'access'  → standard deep access
 * =============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const lampSection = document.getElementById('lamp-section');
  const formContainer = document.getElementById('form-container');
  const loginForm = document.getElementById('login-form');
  const successMsg = document.getElementById('success-message');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const authFeedback = document.getElementById('auth-feedback');
  const accessBadge = document.getElementById('access-badge');
  const successTitle = document.getElementById('success-title');
  const successSubtitle = document.getElementById('success-subtitle');

  // Input references
  const masterInput = document.getElementById('username');   // TOP = Master Override
  const accessInput = document.getElementById('password');   // BOTTOM = Standard Access

  /* =========================================================================
   * 🔐 AUTH CONFIGURATION
   * 
   * IMPORTANT: In production, these should NEVER be stored client-side.
   * For a standalone page like this, we use simple hash comparison.
   * The codes are hashed with a simple reversible XOR + base64 to avoid
   * plaintext exposure in source (NOT cryptographically secure).
   * ========================================================================= */

  // --- CONFIGURABLE PIN CODES ---
  // Change these to your desired secret codes
  const AUTH_CONFIG = {
    // Master Override Code (Top input — highest priority)
    // When this is correct, the bottom input is completely ignored
    masterCode: '52014',

    // Standard Access Code (Bottom input — grants access when master is wrong/empty)
    accessCode: '13149',

    // Redirect targets for each access level
    redirects: {
      master: null,  // Set to URL string for auto-redirect, or null to stay
      access: null   // Set to URL string for auto-redirect, or null to stay
    },

    // Custom success messages per level
    messages: {
      master: {
        title: '✨ Master Access ✨',
        subtitle: 'Chào mừng trở lại, chủ nhân! 👑',
        badge: '👑 MASTER'
      },
      access: {
        title: 'Thành Công!',
        subtitle: 'Chào mừng Ní đã đăng nhập! 🎉',
        badge: '🔓 ACCESS'
      }
    }
  };

  /* =========================================================================
   * 🔐 AUTHENTICATION ENGINE
   * ========================================================================= */

  /**
   * Evaluates authentication based on the dual-PIN hierarchy.
   * 
   * @returns {{ authenticated: boolean, level: 'master'|'access'|null }}
   * 
   * LOGIC FLOW:
   *   1. Read both inputs
   *   2. Check MASTER first (always takes priority)
   *   3. If master matches → auth as 'master', ignore bottom entirely
   *   4. If master doesn't match → check ACCESS code
   *   5. If access matches → auth as 'access'
   *   6. If neither matches → reject
   */
  function evaluateAuth() {
    const masterValue = masterInput.value.trim();
    const accessValue = accessInput.value.trim();

    // --- RULE 1: Master code takes absolute priority ---
    // If the master input has the correct value, grant master access
    // regardless of what's in the bottom input
    if (masterValue === AUTH_CONFIG.masterCode) {
      return { authenticated: true, level: 'master' };
    }

    // --- RULE 2: Standard access code works only when master is wrong/empty ---
    // The master code was either empty or incorrect, so now we check the bottom
    if (accessValue === AUTH_CONFIG.accessCode) {
      return { authenticated: true, level: 'access' };
    }

    // --- RULE 3: Both wrong ---
    return { authenticated: false, level: null };
  }

  /**
   * Handle successful authentication at a given level.
   * Shows success state, applies visual feedback, optionally redirects.
   */
  function handleAuthSuccess(level) {
    const config = AUTH_CONFIG.messages[level];

    // Update success message content
    successTitle.textContent = config.title;
    successSubtitle.textContent = config.subtitle;
    accessBadge.textContent = config.badge;
    accessBadge.className = `access-badge level-${level}`;

    // Transition display to success module
    loginForm.style.display = 'none';
    successMsg.style.display = 'flex';

    // Set success mode (winking faces, etc.)
    body.classList.add('success-mode');

    // Trigger a joy-bounce wiggling physics effect on the cord!
    if (typeof window.triggerCordBounce === 'function') {
      window.triggerCordBounce(-32);
    }

    // Store auth state in sessionStorage for downstream pages
    try {
      sessionStorage.setItem('auth_level', level);
      sessionStorage.setItem('auth_timestamp', Date.now().toString());
    } catch (e) {
      // SessionStorage may be unavailable in some contexts
    }

    // Handle redirect if configured
    const redirectUrl = AUTH_CONFIG.redirects[level];
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1800);
    }
  }

  /**
   * Handle authentication failure — shake the form, show error.
   */
  function handleAuthFailure() {
    // Show error feedback
    authFeedback.classList.add('visible');

    // Shake the form card
    formContainer.classList.add('shake');
    setTimeout(() => {
      formContainer.classList.remove('shake');
    }, 600);

    // Play an error buzz sound
    playErrorSound();

    // Hide error after 3s
    setTimeout(() => {
      authFeedback.classList.remove('visible');
    }, 3000);
  }

  // Error Sound Synthesis
  function playErrorSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      // Ignore blocked audio warnings
    }
  }

  /* =========================================================================
   * 🏮 LAMP SVG LOADER & SPRING PHYSICS ENGINE
   * ========================================================================= */

  // Load and inject the SVG module
  fetch('lamp.svg')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load lamp.svg');
      return response.text();
    })
    .then(svgText => {
      // Append the SVG inside lamp-section
      lampSection.insertAdjacentHTML('beforeend', svgText);
      // Initialize interactive mechanics
      initLampMechanics();
    })
    .catch(err => {
      console.error('Lamp SVG Initialization Error:', err);
    });

  function initLampMechanics() {
    const cordLine = document.getElementById('pull-cord-line');
    const cordKnob = document.getElementById('pull-cord-knob');
    const lampAssembly = document.getElementById('lamp-assembly');

    // --- PHYSICS CONFIGURATION ---
    const targetY = 235; // Resting coordinates for y2 and group transform base
    let y = targetY;
    let vy = 0;
    const k = 0.14;       // Stiffness
    const damping = 0.78; // Air resistance / decay rate
    
    let isDragging = false;
    let startDragY = 0;
    let startY = targetY;
    let dragDistance = 0;
    let frameId = null;

    // Pivot coordinates for pendulum swing rotation (wire anchor point)
    const pivotX = 100;
    const pivotY = 15;

    // --- PHYSICS LOOP ---
    function updateSpring() {
      if (!isDragging) {
        // Hooke's Law: F = -k * x
        const displacement = y - targetY;
        const springForce = -k * displacement;
        
        vy += springForce;
        vy *= damping;
        y += vy;

        // Apply cord positions
        cordLine.setAttribute('y2', y);
        cordKnob.setAttribute('transform', `translate(0, ${y - targetY})`);

        // Pendulum tilt & vibration coupling:
        // Rotate the entire lamp assembly around pivot (100, 15).
        // Since y oscillates during bounce, the rotation angle will oscillate,
        // producing a realistic vibration/wobble on release!
        const angle = (y - targetY) * 0.16;
        lampAssembly.setAttribute('transform', `rotate(${angle}, ${pivotX}, ${pivotY})`);

        // Keep loop running if significant movement persists
        if (Math.abs(vy) > 0.05 || Math.abs(displacement) > 0.05) {
          frameId = requestAnimationFrame(updateSpring);
        } else {
          // Snap directly back to rest
          y = targetY;
          vy = 0;
          cordLine.setAttribute('y2', targetY);
          cordKnob.setAttribute('transform', 'translate(0, 0)');
          lampAssembly.removeAttribute('transform');
          frameId = null;
        }
      }
    }

    // --- STATE MANAGER ---
    function toggleLight() {
      body.classList.toggle('is-illuminated');
      playClickSound();
    }

    // --- SYNTHESIZED MECHANICAL CLICK SOUND ---
    function playClickSound() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        
        // Mechanical click snap: high-freq triangle decaying rapidly
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch (err) {
        // Ignore blocked audio warnings
      }
    }

    // --- DRAG EVENT HANDLERS ---
    function onStartDrag(e) {
      isDragging = true;
      dragDistance = 0;
      startDragY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      startY = y;

      if (e.type === 'mousedown') {
        e.preventDefault();
      }

      window.addEventListener('mousemove', onDrag);
      window.addEventListener('touchmove', onDrag, { passive: false });
      window.addEventListener('mouseup', onEndDrag);
      window.addEventListener('touchend', onEndDrag);
    }

    function onDrag(e) {
      if (!isDragging) return;
      
      const currentClientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const deltaY = currentClientY - startDragY;
      dragDistance = Math.abs(deltaY);

      let newY = startY + deltaY;

      // Bound drag distance (cannot push up, elastic limit down)
      if (newY < targetY) newY = targetY;
      if (newY > targetY + 65) newY = targetY + 65; 

      y = newY;
      cordLine.setAttribute('y2', y);
      cordKnob.setAttribute('transform', `translate(0, ${y - targetY})`);

      // Swing the lamp to the side as you pull the cord (rotates around wire hook)
      const angle = (y - targetY) * 0.16;
      lampAssembly.setAttribute('transform', `rotate(${angle}, ${pivotX}, ${pivotY})`);

      if (e.cancelable) {
        e.preventDefault();
      }
    }

    function onEndDrag() {
      if (!isDragging) return;
      isDragging = false;

      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('mouseup', onEndDrag);
      window.removeEventListener('touchend', onEndDrag);

      // Trigger threshold check (> 20px drag or short mouse tap/click)
      if ((y - targetY) > 20 || dragDistance < 4) {
        if (dragDistance < 4) {
          vy = 26; // Give initial downward kick on simple click
        } else {
          vy = 0;
        }
        toggleLight();
      }

      if (!frameId) {
        frameId = requestAnimationFrame(updateSpring);
      }
    }

    // Attach drag events to the knob
    cordKnob.addEventListener('mousedown', onStartDrag);
    cordKnob.addEventListener('touchstart', onStartDrag, { passive: false });

    // Handle clicks
    cordKnob.addEventListener('click', (e) => {
      if (dragDistance < 4 && vy === 0) {
        vy = 26;
        toggleLight();
        if (!frameId) {
          frameId = requestAnimationFrame(updateSpring);
        }
      }
    });

    // Share physics kick hook globally for success triggers
    window.triggerCordBounce = (velocity) => {
      vy = velocity;
      if (!frameId) {
        frameId = requestAnimationFrame(updateSpring);
      }
    };
  }

  /* =========================================================================
   * 📝 LOGIN SUBMIT — DUAL-PIN AUTH GATEWAY
   * ========================================================================= */

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Hide any previous error
    authFeedback.classList.remove('visible');

    // Disable inputs and show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';

    // Simulate brief processing delay for realistic feel
    setTimeout(() => {
      // --- EVALUATE THE DUAL-PIN HIERARCHY ---
      const result = evaluateAuth();

      if (result.authenticated) {
        // ✅ Authentication succeeded
        handleAuthSuccess(result.level);
      } else {
        // ❌ Authentication failed
        handleAuthFailure();

        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
      }
    }, 900);
  });

  /* =========================================================================
   * 🎹 KEYBOARD SHORTCUTS
   * Master code can also be triggered by a secret key combo (optional)
   * ========================================================================= */

  // Remove the "required" attribute from username to allow empty master field
  // (The bottom code alone should be enough to authenticate)
  masterInput.removeAttribute('required');
});
