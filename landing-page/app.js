// Interactive Features for iAttend Landing Page

document.addEventListener('DOMContentLoaded', () => {
  setupShowcaseTabs();
  setupAccordion();
  setupCredentialsCopy();
});

// Setup App Showcase tabs switcher
function setupShowcaseTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const screens = document.querySelectorAll('.app-screen');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs & screens
      tabs.forEach(t => t.classList.remove('active'));
      screens.forEach(s => s.classList.remove('active'));

      // Activate selected tab & corresponding screen
      tab.classList.add('active');
      const targetScreen = document.getElementById(`screen-${tab.dataset.role}`);
      if (targetScreen) {
        targetScreen.classList.add('active');
      }
    });
  });
}

// Setup How To Install Accordion
function setupAccordion() {
  const stepCards = document.querySelectorAll('.step-card');

  stepCards.forEach(card => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      
      // Close all cards
      stepCards.forEach(c => c.classList.remove('open'));
      
      // If the clicked card wasn't open, open it
      if (!isOpen) {
        card.classList.add('open');
      }
    });
  });
  
  // Proactively open first step
  if (stepCards.length > 0) {
    stepCards[0].classList.add('open');
  }
}

// Helper utility to make demo credentials interactive
function setupCredentialsCopy() {
  const cards = document.querySelectorAll('.cred-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const email = card.dataset.email;
      const pass = card.dataset.password;
      
      if (email && pass) {
        // Highlight active card
        cards.forEach(c => c.style.borderColor = '');
        card.style.borderColor = 'var(--accent-color)';
        
        // Simple notification inside card that they are copied or selected
        const toast = document.createElement('div');
        toast.style.position = 'absolute';
        toast.style.background = 'var(--accent-color)';
        toast.style.color = '#fff';
        toast.style.padding = '4px 8px';
        toast.style.borderRadius = '4px';
        toast.style.fontSize = '0.7rem';
        toast.style.top = '10px';
        toast.style.right = '10px';
        toast.innerText = 'Copied!';
        
        card.style.position = 'relative';
        card.appendChild(toast);
        
        // Copy to clipboard
        navigator.clipboard.writeText(`Email: ${email} | Password: ${pass}`).then(() => {
          setTimeout(() => {
            toast.remove();
          }, 1500);
        });
      }
    });
  });
}
