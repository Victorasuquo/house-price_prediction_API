/* ============================================
   House Price Prediction - JavaScript
   ============================================ */

// Use relative URL — frontend is served from the same origin as the API
const API_BASE_URL = '';

// DOM Elements
const form = document.getElementById('predictionForm');
const sizeInput = document.getElementById('size');
const bedroomsInput = document.getElementById('bedrooms');
const ageInput = document.getElementById('age');
const predictBtn = document.getElementById('predictBtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const loading = document.getElementById('loading');
const statusBadge = document.getElementById('statusBadge');
const resetBtn = document.getElementById('resetBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    form.addEventListener('submit', handlePrediction);
    resetBtn.addEventListener('click', resetForm);

    // Validation on input
    [sizeInput, bedroomsInput, ageInput].forEach(input => {
        input.addEventListener('change', clearError);
    });
});

/**
 * Check API Health Status
 */
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            updateStatus(true);
        } else {
            updateStatus(false);
        }
    } catch (error) {
        console.error('Health check failed:', error);
        updateStatus(false);
    }
}

/**
 * Update Status Badge
 */
function updateStatus(isOnline) {
    const dot = statusBadge.querySelector('.status-dot');
    const text = statusBadge.querySelector('.status-text');

    if (isOnline) {
        dot.classList.remove('offline');
        text.textContent = 'API Connected';
        predictBtn.disabled = false;
    } else {
        dot.classList.add('offline');
        text.textContent = 'API Offline';
        predictBtn.disabled = true;
    }
}

/**
 * Validate Form Inputs
 */
function validateForm() {
    let isValid = true;

    // Validate size
    const size = parseFloat(sizeInput.value);
    if (isNaN(size) || size < 500 || size > 20000) {
        showError(sizeInput, 'Size must be between 500 and 20,000 sq ft');
        isValid = false;
    } else {
        clearError(sizeInput);
    }

    // Validate bedrooms
    const bedrooms = parseInt(bedroomsInput.value);
    if (isNaN(bedrooms) || bedrooms < 1 || bedrooms > 10) {
        showError(bedroomsInput, 'Bedrooms must be between 1 and 10');
        isValid = false;
    } else {
        clearError(bedroomsInput);
    }

    // Validate age
    const age = parseFloat(ageInput.value);
    if (isNaN(age) || age < 0 || age > 150) {
        showError(ageInput, 'Age must be between 0 and 150 years');
        isValid = false;
    } else {
        clearError(ageInput);
    }

    return isValid;
}

/**
 * Show Input Error
 */
function showError(input, message) {
    const errorElement = input.parentElement.querySelector('.form-error');
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

/**
 * Clear Input Error
 */
function clearError(event) {
    const input = event.target || event;
    const errorElement = input.parentElement.querySelector('.form-error');
    input.classList.remove('error');
    errorElement.classList.remove('show');
    errorElement.textContent = '';
}

/**
 * Handle Prediction Form Submission
 */
async function handlePrediction(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const size = parseFloat(sizeInput.value);
    const bedrooms = parseInt(bedroomsInput.value);
    const age = parseFloat(ageInput.value);

    try {
        showLoading(true);
        hideResults();
        hideError();

        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                size: size,
                bedrooms: bedrooms,
                age: age
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Prediction failed');
        }

        const data = await response.json();
        displayResults(data, size, bedrooms, age);

    } catch (error) {
        console.error('Prediction error:', error);
        displayError(error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Display Prediction Results
 */
function displayResults(data, size, bedrooms, age) {
    const price = data.predicted_price_usd;
    const pricePerSqft = (price / size).toFixed(2);

    // Update result elements
    document.getElementById('resultPrice').textContent = formatCurrency(price);
    document.getElementById('detailSize').textContent = `${formatNumber(size)} sq ft`;
    document.getElementById('detailBedrooms').textContent = `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`;
    document.getElementById('detailAge').textContent = `${age} ${age === 1 ? 'year' : 'years'} old`;
    document.getElementById('perSqft').textContent = formatCurrency(pricePerSqft);

    // Show results with animation
    resultsSection.style.display = 'flex';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Add animation
    resultsSection.style.animation = 'none';
    setTimeout(() => {
        resultsSection.style.animation = 'slideInUp 0.5s ease-out';
    }, 10);
}

/**
 * Display Error Message
 */
function displayError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorSection.style.display = 'flex';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide Results Section
 */
function hideResults() {
    resultsSection.style.display = 'none';
}

/**
 * Hide Error Section
 */
function hideError() {
    errorSection.style.display = 'none';
}

/**
 * Show/Hide Loading State
 */
function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
    predictBtn.disabled = show;
}

/**
 * Reset Form
 */
function resetForm() {
    form.reset();
    sizeInput.focus();
    hideResults();
    hideError();

    // Clear any errors
    [sizeInput, bedroomsInput, ageInput].forEach(input => {
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.form-error');
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    });
}

/**
 * Format Currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Format Number with Commas
 */
function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Check API health periodically
setInterval(checkAPIHealth, 30000); // Every 30 seconds
