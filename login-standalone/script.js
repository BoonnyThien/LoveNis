/* --- SCRIPT.JS: SPRING PHYSICS, WEB AUDIO & EVENT BINDINGS --- */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const lampSection = document.getElementById('lamp-section');
  const formContainer = document.getElementById('form-container');
  const loginForm = document.getElementById('login-form');
  const successMsg = document.getElementById('success-message');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

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

  // --- LOGIN SUBMIT WITH JOY BOUNCE ---
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Disable inputs and show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';

    setTimeout(() => {
      // Transition display to success module
      loginForm.style.display = 'none';
      successMsg.style.display = 'flex';

      // Set success mode (winking faces, etc.)
      body.classList.add('success-mode');

      // Trigger a joy-bounce wiggling physics effect on the cord!
      if (typeof window.triggerCordBounce === 'function') {
        window.triggerCordBounce(-32);
      }
    }, 1200);
  });
});
