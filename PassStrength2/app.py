from flask import Flask, render_template, request, jsonify
import re
import math

app = Flask(__name__)

# ================= COMMON PASSWORDS =================
COMMON_PASSWORDS = {
    "password", "123456", "123456789", "qwerty",
    "abc123", "letmein", "monkey", "11111", "admin"
}

# ================= BASIC CHECKS =================
def has_lower(p): return bool(re.search(r'[a-z]', p))
def has_upper(p): return bool(re.search(r'[A-Z]', p))
def has_digit(p): return bool(re.search(r'\d', p))
def has_special(p): return bool(re.search(r'[!@#$%^&*()\[\]\-+_=;:\'",.<>/?\\`~|{}]', p))

def is_common(p):
    return p.lower() in COMMON_PASSWORDS

# ================= SHANNON ENTROPY =================
def shannon_entropy(password):
    charset = 0
    if has_lower(password): charset += 26
    if has_upper(password): charset += 26
    if has_digit(password): charset += 10
    if has_special(password): charset += 32

    if charset == 0:
        return 0.0

    return len(password) * math.log2(charset)

# ================= REAL-WORLD CRACK TIME =================
def estimate_crack_time(password, entropy, guesses_per_second=1e10):
    penalty = 1.0
    p = password.lower()

    # Real-world weaknesses
    if re.search(r'(ravi|yadav|admin|user|test|india|love)', p):
        penalty *= 0.000001

    if is_common(password):
        penalty *= 0.0000001

    if re.search(r'(\d)\1{1,}', password):
        penalty *= 0.001

    if re.search(r'(123|abc|qwerty|000|789)', p):
        penalty *= 0.00001

    if re.match(r'^[A-Za-z]+[0-9]+$', password):
        penalty *= 0.0001

    if len(password) < 8:
        penalty *= 0.0001

    total = 2 ** entropy
    avg = total / 2

    adjusted = avg * penalty
    seconds = adjusted / guesses_per_second
    return seconds

# ================= HUMAN TIME =================
def human_time(seconds):
    if seconds < 1:
        return "Instant"

    minute = 60
    hour = 3600
    day = 86400
    year = 31536000

    if seconds < minute:
        return "Seconds"
    elif seconds < hour:
        return "Minutes"
    elif seconds < day:
        return "Hours"
    elif seconds < year:
        return "Days"
    elif seconds < year * 100:
        return "Years"
    else:
        return "Centuries"

# ================= ENTROPY TABLE =================
def entropy_table(entropy):
    if entropy < 30:
        return "Weak"
    elif entropy < 50:
        return "Moderate"
    elif entropy < 70:
        return "Strong"
    else:
        return "Very Strong"

# ================= SCORE =================
def score_password(password):
    score = 0
    suggestions = []

    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("Use at least 8 characters")

    if has_lower(password) and has_upper(password):
        score += 1
    else:
        suggestions.append("Use uppercase & lowercase")

    if has_digit(password):
        score += 1
    else:
        suggestions.append("Add numbers")

    if has_special(password):
        score += 1
    else:
        suggestions.append("Add special characters")

    if not is_common(password):
        score += 1
    else:
        suggestions.append("Avoid common passwords")

    return score, suggestions

# ================= MAIN FUNCTION =================
def evaluate(password):
    entropy = shannon_entropy(password)
    crack_seconds = estimate_crack_time(password, entropy)

    score, suggestions = score_password(password)

    return {
        "password": password,
        "length": len(password),

        # Shannon entropy
        "entropy_bits": round(entropy, 2),
        "entropy_strength": entropy_table(entropy),

        # Crack time
        "crack_time_category": human_time(crack_seconds),
        "crack_time_seconds": crack_seconds,

        # Score
        "score": score,
        "suggestions": suggestions
    }

# ================= ROUTES =================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    password = data.get('password', '')
    return jsonify(evaluate(password))

# ================= RUN =================
if __name__ == '__main__':
    app.run(debug=True)