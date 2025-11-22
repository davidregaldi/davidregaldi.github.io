document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (!toggleBtn) return;

    const iconSpan = toggleBtn.querySelector('.daw-icon');
    const body = document.body;

    function updateState(isDark) {
        if (isDark) {
            toggleBtn.classList.add('active');
            if (iconSpan) iconSpan.textContent = '⏾';
        } else {
            toggleBtn.classList.remove('active');
            if (iconSpan) iconSpan.textContent = '☀';
        }
    }

    // Check for saved preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        updateState(true);
    } else {
        updateState(false);
    }

    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        updateState(isDark);

        if (isDark) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });
});
