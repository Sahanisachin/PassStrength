document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const resultDiv = document.getElementById('result');
    
    let debounceTimer;
    
    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
    
    // Real-time password analysis
    passwordInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const password = e.target.value;
        
        // Show loading state
        resultDiv.innerHTML = '<div class="loading">🔍 Analyzing password with Shannon Entropy...</div>';
        
        // Debounce to avoid too many requests
        debounceTimer = setTimeout(() => {
            analyzePassword(password);
        }, 300);
    });
    
    // Function to call the Flask API
    async function analyzePassword(password) {
        if (!password) {
            resultDiv.innerHTML = '<div class="loading">🔍 Enter a password to analyze...</div>';
            return;
        }
        
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password })
            });
            
            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerHTML = '<div class="loading">❌ Error analyzing password. Please try again.</div>';
        }
    }
    
    // Display the results with entropy table
    function displayResults(data) {
        const strengthClass = `strength-${data.entropy_strength}`;
        
        // Determine which entropy level to highlight
        const entropyValue = data.entropy_bits;
        
        const html = `
            <div class="result-card">
                <div class="strength-header">
                    <div class="score-badge">Score: ${data.score}/5</div>
                    <div class="strength-badge ${strengthClass}">${data.entropy_strength}</div>
                </div>
                
                <!-- Shannon Entropy Table -->
                <div class="entropy-table">
                    <div class="entropy-table-title">📊 SHANNON ENTROPY TABLE (bits)</div>
                    <div class="entropy-table-grid">
                        <div class="entropy-table-item ${entropyValue < 30 ? 'highlight' : ''}">
                            <div class="entropy-range">&lt; 30</div>
                            <div class="entropy-level">Weak</div>
                        </div>
                        <div class="entropy-table-item ${entropyValue >= 30 && entropyValue < 50 ? 'highlight' : ''}">
                            <div class="entropy-range">30 - 50</div>
                            <div class="entropy-level">Moderate</div>
                        </div>
                        <div class="entropy-table-item ${entropyValue >= 50 && entropyValue < 70 ? 'highlight' : ''}">
                            <div class="entropy-range">50 - 70</div>
                            <div class="entropy-level">Strong</div>
                        </div>
                        <div class="entropy-table-item ${entropyValue >= 70 ? 'highlight' : ''}">
                            <div class="entropy-range">&gt; 70</div>
                            <div class="entropy-level">Very Strong</div>
                        </div>
                    </div>
                </div>
                
                <div class="metrics">
                    <div class="metric-card">
                        <div class="metric-label">🔢 SHANNON ENTROPY</div>
                        <div class="metric-value">${data.entropy_bits} bits</div>
                        <div class="metric-sub">Your password: ${data.entropy_strength}</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">⏱️ ESTIMATED CRACK TIME</div>
                        <div class="metric-value">${data.crack_time_category}</div>
                        <div class="metric-sub">At 10 billion guesses/second</div>
                        <div class="metric-sub" style="font-size: 0.7rem; margin-top: 5px;">
                            ${data.crack_time_seconds < 1 ? 'Less than 1 second' : 
                              data.crack_time_seconds < 60 ? `${Math.floor(data.crack_time_seconds)} seconds` :
                              data.crack_time_seconds < 3600 ? `${Math.floor(data.crack_time_seconds / 60)} minutes` :
                              data.crack_time_seconds < 86400 ? `${Math.floor(data.crack_time_seconds / 3600)} hours` :
                              data.crack_time_seconds < 31536000 ? `${Math.floor(data.crack_time_seconds / 86400)} days` :
                              `${Math.floor(data.crack_time_seconds / 31536000)} years`}
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">📊 PASSWORD LENGTH</div>
                        <div class="metric-value">${data.length} characters</div>
                        <div class="metric-sub">Longer = stronger</div>
                    </div>
                </div>
                
                <div class="suggestions-section">
                    <div class="suggestions-title">📋 SECURITY RECOMMENDATIONS</div>
                    <ul class="suggestions-list">
                        ${data.suggestions.length === 0 ? 
                            '<li class="perfect">✅ Perfect! Your password meets all security requirements!</li>' :
                            data.suggestions.map(s => `<li>${s}</li>`).join('')
                        }
                    </ul>
                </div>
            </div>
        `;
        
        resultDiv.innerHTML = html;
    }
});