const sections = document.querySelectorAll('section, header');
const navLinks = document.querySelectorAll('.nav-links a');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-links');
const select = document.getElementById('customSelect');
const options = document.querySelectorAll('.custom-option');
const hiddenInput = document.getElementById('servizioInput');
const form = document.getElementById('contactForm');
const submitButton = document.getElementById('submitButton');
const toast = document.getElementById('toast');

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
        toast.className = 'toast';
    }, 3500);
}

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 220) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

if (navToggle) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function openSelect() {
    select.classList.add('open');
    select.setAttribute('aria-expanded', 'true');
}

function closeSelect() {
    select.classList.remove('open');
    select.setAttribute('aria-expanded', 'false');
}

select.addEventListener('click', (e) => {
    e.stopPropagation();
    if (select.classList.contains('open')) {
        closeSelect();
    } else {
        openSelect();
    }
});

select.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (select.classList.contains('open')) {
            closeSelect();
        } else {
            openSelect();
        }
    }

    if (e.key === 'Escape') {
        closeSelect();
    }
});

options.forEach((option) => {
    option.addEventListener('click', () => {
        options.forEach((item) => item.classList.remove('selected'));
        option.classList.add('selected');
        select.innerText = option.innerText;
        select.style.color = 'var(--text-main)';
        hiddenInput.value = option.dataset.value;
        closeSelect();
    });
});

document.addEventListener('click', () => {
    closeSelect();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!hiddenInput.value) {
        showToast('Seleziona un servizio prima di inviare.', 'error');
        return;
    }

    const formData = new FormData(form);
    const payload = {
        nome: formData.get('nome')?.toString().trim(),
        email: formData.get('email')?.toString().trim(),
        servizio: formData.get('servizio')?.toString().trim(),
        messaggio: formData.get('messaggio')?.toString().trim()
    };

    if (!payload.nome || !payload.email || !payload.servizio || !payload.messaggio) {
        showToast('Compila tutti i campi richiesti.', 'error');
        return;
    }


    submitButton.disabled = true;
submitButton.textContent = 'INVIO IN CORSO...';

try {
    const response = await fetch('https://formspree.io/f/xrerqrbl', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Invio non riuscito');
    }

    form.reset();
    hiddenInput.value = '';
    select.innerText = 'Servizio richiesto...';
    select.style.color = 'var(--text-secondary)';
    options.forEach((item) => item.classList.remove('selected'));

    showToast('Richiesta inviata correttamente. Controlla la tua casella o attendi la mia risposta.', 'success');

} catch (error) {
    console.error(error);
    showToast('RICHIESTA INVIATA!', 'error');
} finally {
    submitButton.disabled = false;
    submitButton.textContent = 'INVIA RICHIESTA';
}
});
