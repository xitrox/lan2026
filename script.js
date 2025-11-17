// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Progress bar animation on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progressBars = entry.target.querySelectorAll('.progress-fill');
            progressBars.forEach(bar => {
                // Reset and animate
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        }
    });
}, observerOptions);

// Observe survey cards
document.querySelectorAll('.survey-card').forEach(card => {
    progressObserver.observe(card);
});

// Form handling
const rsvpForm = document.getElementById('rsvp-form');
const formResponse = document.getElementById('form-response');

if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(rsvpForm);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = rsvpForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-text">Sending...</span>';
        submitBtn.disabled = true;
        
        try {
            // Send to serverless function
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                // Success
                formResponse.className = 'form-response success';
                formResponse.innerHTML = '✓ RSVP submitted successfully! We\'ll be in touch soon, soldier!';
                formResponse.style.display = 'block';
                rsvpForm.reset();
                
                // Scroll to response
                formResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            // Error - but still show success for now since backend isn't set up
            // In production, you'd show an actual error
            console.error('Form submission error:', error);
            
            // For development/demo purposes, show success message
            formResponse.className = 'form-response success';
            formResponse.innerHTML = '✓ RSVP received! (Demo mode - backend not yet configured)';
            formResponse.style.display = 'block';
            rsvpForm.reset();
            
            // Uncomment below for production error handling:
            // formResponse.className = 'form-response error';
            // formResponse.innerHTML = '✗ There was an error submitting your RSVP. Please try again or contact the organizers directly.';
            // formResponse.style.display = 'block';
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Add animation class on load
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode.splice(-konamiSequence.length - 1, konamiCode.length - konamiSequence.length);
    
    if (konamiCode.join('') === konamiSequence.join('')) {
        document.body.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            document.body.style.transform = 'rotate(0deg)';
            alert('🎮 Cheat code activated! No extra lives available for LAN parties though...');
        }, 1000);
    }
});
