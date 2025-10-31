// Questionnaire Multi-Step Form Logic

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('questionnaire-form');
    const sections = document.querySelectorAll('.form-section');
    const progressBar = document.getElementById('progress-bar');
    const currentStepDisplay = document.getElementById('current-step');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    let currentStep = 1;
    const totalSteps = sections.length;
    
    // Initialize
    showSection(currentStep);
    
    // Next button
    nextBtn.addEventListener('click', () => {
        if (validateSection(currentStep)) {
            currentStep++;
            showSection(currentStep);
        }
    });
    
    // Previous button
    prevBtn.addEventListener('click', () => {
        currentStep--;
        showSection(currentStep);
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateSection(currentStep)) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Collect checkbox values
            data.markets = Array.from(form.querySelectorAll('input[name="markets"]:checked')).map(cb => cb.value);
            data.features = Array.from(form.querySelectorAll('input[name="features"]:checked')).map(cb => cb.value);
            
            console.log('Form Data:', data);
            
            // Show loading state
            submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            submitBtn.disabled = true;
            
            // Simulate API call (replace with actual submission)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Send to email (replace with your actual endpoint)
            try {
                // Example: Send to a backend endpoint or service
                // await fetch('/api/questionnaire', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(data)
                // });
                
                // For now, create a mailto link with the data
                const subject = 'New Shopify Roadmap Request from ' + data['company-name'];
                const body = `
New questionnaire submission:

BUSINESS BASICS:
- Company: ${data['company-name']}
- Website: ${data.website || 'N/A'}
- Industry: ${data.industry}
- Stage: ${data['business-stage']}

GOALS:
- Primary Goal: ${data['primary-goal']}
- Timeline: ${data.timeline}
- Expected Revenue: ${data.revenue || 'N/A'}
- Target Markets: ${data.markets.join(', ') || 'N/A'}

TECHNICAL:
- Product Count: ${data['product-count']}
- Features: ${data.features.join(', ') || 'None selected'}
- Integrations: ${data.integrations || 'N/A'}
- Content Readiness: ${data['content-ready']}

SUPPORT:
- Experience: ${data.experience}
- Involvement: ${data.involvement}
- Post-Launch: ${data['post-launch']}
- Notes: ${data.notes || 'N/A'}

BUDGET & CONTACT:
- Budget: ${data.budget}
- Name: ${data['first-name']} ${data['last-name']}
- Email: ${data.email}
- Phone: ${data.phone || 'N/A'}
- Referral Source: ${data['referral-source'] || 'N/A'}
- Subscribe: ${data.subscribe ? 'Yes' : 'No'}
                `.trim();
                
                // Create mailto link
                window.location.href = `mailto:shopify@4ourmedia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                // Redirect to confirmation page after a moment
                setTimeout(() => {
                    window.location.href = 'confirmation.html?email=' + encodeURIComponent(data.email);
                }, 2000);
                
            } catch (error) {
                console.error('Submission error:', error);
                alert('There was an error submitting your form. Please try again or contact us directly at shopify@4ourmedia.com');
                submitBtn.innerHTML = 'Get My Roadmap →';
                submitBtn.disabled = false;
            }
        }
    });
    
    function showSection(step) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        
        // Show current section
        const currentSection = document.getElementById(`section-${step}`);
        if (currentSection) {
            currentSection.classList.remove('hidden');
            currentSection.classList.add('active');
        }
        
        // Update progress bar
        const progress = (step / totalSteps) * 100;
        progressBar.style.width = progress + '%';
        currentStepDisplay.textContent = step;
        
        // Update buttons
        if (step === 1) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
        
        if (step === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function validateSection(step) {
        const section = document.getElementById(`section-${step}`);
        const requiredFields = section.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                const radioGroup = section.querySelectorAll(`[name="${field.name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                if (!isChecked) {
                    isValid = false;
                    // Highlight the radio group
                    radioGroup.forEach(radio => {
                        radio.closest('label').classList.add('border-red-500');
                    });
                } else {
                    radioGroup.forEach(radio => {
                        radio.closest('label').classList.remove('border-red-500');
                    });
                }
            } else {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-red-500');
                    field.focus();
                } else {
                    field.classList.remove('border-red-500');
                }
            }
        });
        
        if (!isValid) {
            // Shake effect
            section.classList.add('animate-shake');
            setTimeout(() => {
                section.classList.remove('animate-shake');
            }, 500);
        }
        
        return isValid;
    }
    
    // Add shake animation class dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
    
    // Save progress to localStorage (optional - for save & resume functionality)
    form.addEventListener('input', () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        localStorage.setItem('questionnaire-progress', JSON.stringify({
            step: currentStep,
            data: data
        }));
    });
    
    // Load saved progress (optional)
    const savedProgress = localStorage.getItem('questionnaire-progress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            // Optionally restore form data here
            // currentStep = progress.step;
            // showSection(currentStep);
        } catch (e) {
            console.error('Error loading saved progress:', e);
        }
    }
});
