// Globální proměnné
let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let isLoading = true;

// Tracking variables
let userId = null;
let sessionStartTime = null;
let surveyStartTime = null;

// Google Apps Script Web App URL - REPLACE THIS WITH YOUR ACTUAL URL
const TRACKING_API_URL = 'https://script.google.com/macros/s/AKfycbwTYvN6ZRJG2Y-V-tNyL5y-zYif1-t-rKcmoV_jr15whoXwOZM2jzq0Inhw6YXI2UeU/exec';

// Načtení dat při startu
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize user tracking
    initializeUserTracking();
    
    // Create initial user record (only if new user/session)
    await trackEvent('page_load');
    
    await loadQuizData();
});

// Načtení dat z JSON souboru
async function loadQuizData() {
    try {
        showLoadingIndicator('Načítám data ankety...');
        
        const response = await fetch('volby2025_dataset.json');
        quizData = await response.json();
        isLoading = false;
        
        // Inicializace pole odpovědí
        userAnswers = new Array(quizData.questions.length).fill(null).map(() => ({
            agreement: 50,
            importance: 50
        }));
        
        console.log('Data úspěšně načtena:', quizData);
        
        // Hide loading indicator after data is loaded
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        hideLoadingIndicator();
        
        document.getElementById('intro-section').innerHTML = `
            <h2>Chyba při načítání dat</h2>
            <p>Nepodařilo se načíst data ankety. Zkontrolujte, že je soubor volby2025_dataset.json dostupný.</p>
            <button class="start-button" onclick="location.reload()">Zkusit znovu</button>
        `;
    }
}

// Spuštění ankety
async function startQuiz() {
    if (isLoading || !quizData) {
        showLoadingIndicator('Data se načítají...');
        return;
    }
    
    // Disable button to prevent double clicks
    const startButton = document.querySelector('.start-button');
    if (startButton) {
        startButton.disabled = true;
        startButton.textContent = 'Zahajuji...';
    }
    
    try {
        // Track survey start
        surveyStartTime = new Date();
        await trackEvent('survey_start', {
            sessionStart: surveyStartTime.toISOString(),
            totalQuestions: quizData.questions.length
        });
        
        currentQuestionIndex = 0;
        document.getElementById('intro-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        
        showQuestion(currentQuestionIndex);
        updateProgress();
        
    } finally {
        // Re-enable button in case user navigates back
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = 'Začít anketu';
        }
    }
}

// Zobrazení konkrétní otázky
function showQuestion(index) {
    const question = quizData.questions[index];
    const userAnswer = userAnswers[index];
    
    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = `
        <div class="question-card">
            <div class="question-header">
                <div class="question-number">Otázka ${index + 1} z ${quizData.questions.length}</div>
                <div class="question-category">${question.category}</div>
                <div class="question-text">${question.question}</div>
                <div class="question-explanation">${question.explanation}</div>
            </div>
            
            <div class="answer-section">
                <div class="answer-group">
                    <label class="answer-label">
                        Míra souhlasu s tímto tvrzením: 
                        <span class="slider-value" id="agreement-value">${userAnswer.agreement}%</span>
                    </label>
                    <div class="slider-container">
                        <input type="range" 
                               class="slider" 
                               id="agreement-slider"
                               min="0" 
                               max="100" 
                               value="${userAnswer.agreement}"
                               oninput="updateSliderValue('agreement', this.value)">
                        <div class="slider-labels">
                            <span>Silně nesouhlasím (0%)</span>
                            <span>Neutrální (50%)</span>
                            <span>Silně souhlasím (100%)</span>
                        </div>
                    </div>
                </div>
                
                <div class="answer-group">
                    <label class="answer-label">
                        Důležitost tohoto témata pro vás:
                        <span class="slider-value" id="importance-value">${userAnswer.importance}%</span>
                    </label>
                    <div class="slider-container">
                        <input type="range" 
                               class="slider" 
                               id="importance-slider"
                               min="0" 
                               max="100" 
                               value="${userAnswer.importance}"
                               oninput="updateSliderValue('importance', this.value)">
                        <div class="slider-labels">
                            <span>Nedůležité (0%)</span>
                            <span>Středně důležité (50%)</span>
                            <span>Velmi důležité (100%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Aktualizace navigačních tlačítek
    updateNavigationButtons();
}

// Aktualizace hodnoty slideru
function updateSliderValue(type, value) {
    const numValue = parseInt(value);
    userAnswers[currentQuestionIndex][type] = numValue;
    
    const valueDisplay = document.getElementById(`${type}-value`);
    valueDisplay.textContent = `${numValue}%`;
    
    // Uložení do localStorage pro případ obnovení stránky
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
}

// Aktualizace progress baru
function updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// Aktualizace navigačních tlačítek
function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    
    prevButton.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.questions.length - 1) {
        nextButton.textContent = 'Zobrazit výsledky';
        nextButton.onclick = showResults;
    } else {
        nextButton.textContent = 'Další →';
        nextButton.onclick = nextQuestion;
    }
}

// Přechod na další otázku
function nextQuestion() {
    if (currentQuestionIndex < quizData.questions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
        updateProgress();
    }
}

// Přechod na předchozí otázku
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
        updateProgress();
    }
}

// Výpočet shody se stranami
function calculatePartyMatches() {
    const partyScores = {};
    
    // Inicializace skóre pro všechny strany
    quizData.parties.forEach(party => {
        partyScores[party.id] = {
            party: party,
            totalScore: 0,
            maxPossibleScore: 0
        };
    });
    
    // Výpočet skóre pro každou otázku
    quizData.questions.forEach((question, questionIndex) => {
        const userAnswer = userAnswers[questionIndex];
        const importance = userAnswer.importance / 100; // Normalizace na 0-1
        
        Object.keys(question.party_positions).forEach(partyId => {
            if (partyScores[partyId]) {
                const partyPosition = question.party_positions[partyId] * 10; // Převod z 1-10 na 0-100
                const userPosition = userAnswer.agreement;
                
                // Výpočet vzdálenosti (čím menší, tím lepší shoda)
                const distance = Math.abs(userPosition - partyPosition);
                const maxDistance = 100; // Maximální možná vzdálenost
                
                // Převod na skóre (čím menší vzdálenost, tím vyšší skóre)
                const questionScore = (maxDistance - distance) * importance;
                const maxQuestionScore = maxDistance * importance;
                
                partyScores[partyId].totalScore += questionScore;
                partyScores[partyId].maxPossibleScore += maxQuestionScore;
            }
        });
    });
    
    // Převod na procenta a seřazení
    const results = Object.values(partyScores).map(item => ({
        party: item.party,
        percentage: item.maxPossibleScore > 0 ? 
            Math.round((item.totalScore / item.maxPossibleScore) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage);
    
    return results;
}

// Zobrazení výsledků
async function showResults() {
    // Disable the next button to prevent double clicks
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.disabled = true;
        nextButton.textContent = 'Ukládám výsledky...';
    }
    
    try {
        // Skrytí sekce s otázkami
        document.getElementById('quiz-section').style.display = 'none';
        
        // Výpočet výsledků
        const results = calculatePartyMatches();
        
        // Calculate session duration and completion rate
        const sessionDuration = surveyStartTime ? 
            Math.round((new Date() - surveyStartTime) / 1000) : 0;
        const completionRate = Math.round((currentQuestionIndex + 1) / quizData.questions.length * 100);
        
        // Track survey completion
        await trackEvent('survey_complete', {
            results: results,
            sessionDuration: sessionDuration,
            totalQuestions: quizData.questions.length,
            completionRate: completionRate
        });
        
        // Zobrazení sekce s výsledky
        const resultsSection = document.getElementById('results-section');
        const resultsContainer = document.getElementById('results-container');
        
        resultsContainer.innerHTML = results.map((result, index) => `
            <div class="party-result" style="border-left-color: ${result.party.color}">
                <div class="party-rank">${index + 1}.</div>
                <div class="party-info">
                    <div class="party-name">${result.party.name}</div>
                    <div class="party-description">${result.party.description}</div>
                    <div style="font-size: 0.85rem; color: #888; margin-top: 5px;">
                        Lídr: ${result.party.leader}
                    </div>
                </div>
                <div class="party-score">${result.percentage}%</div>
            </div>
        `).join('');
        
        resultsSection.style.display = 'block';
        
        // Uložení výsledků
        localStorage.setItem('quizResults', JSON.stringify(results));
        
        // Scroll na začátek výsledků
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } finally {
        // Re-enable button (though user won't see this in normal flow)
        if (nextButton) {
            nextButton.disabled = false;
            nextButton.textContent = 'Zobrazit výsledky';
        }
    }
}

// Restart ankety
async function restartQuiz() {
    // Disable restart button to prevent double clicks
    const restartButton = document.querySelector('.restart-button');
    if (restartButton) {
        restartButton.disabled = true;
        restartButton.textContent = '🔄 Restartuji...';
    }
    
    try {
        // Vymazání uložených dat
        localStorage.removeItem('userAnswers');
        localStorage.removeItem('quizResults');
        
        // Reset tracking
        surveyStartTime = null;
        
        // Generate new user ID for new session
        initializeUserTracking();
        
        // Track restart (this creates a new record)
        await trackEvent('restart');
        
        // Reset stavu
        currentQuestionIndex = 0;
        userAnswers = new Array(quizData.questions.length).fill(null).map(() => ({
            agreement: 50,
            importance: 50
        }));
        
        // Zobrazení úvodní sekce
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('intro-section').style.display = 'block';
        
        // Scroll na začátek
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
        
    } finally {
        // Re-enable restart button
        if (restartButton) {
            restartButton.disabled = false;
            restartButton.textContent = '🔄 Zkusit znovu';
        }
    }
}

// Obnovení stavu z localStorage (pokud uživatel obnoví stránku)
function restoreState() {
    const savedAnswers = localStorage.getItem('userAnswers');
    if (savedAnswers) {
        userAnswers = JSON.parse(savedAnswers);
    }
}

// Utility funkce pro formátování procent
function formatPercentage(value) {
    return Math.round(value) + '%';
}

// Export dat pro analýzu (volitelná funkce)
function exportResults() {
    if (!userAnswers || !quizData) return;
    
    const exportData = {
        timestamp: new Date().toISOString(),
        answers: userAnswers,
        results: calculatePartyMatches(),
        quiz_version: quizData.metadata
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `volby2025_vysledky_${Date.now()}.json`;
    link.click();
}

// === TRACKING FUNCTIONS ===

/**
 * Initialize user tracking - generate unique user ID
 */
function initializeUserTracking() {
    sessionStartTime = new Date();
    
    // Generate or retrieve user ID
    let storedUserId = localStorage.getItem('survey_user_id');
    
    if (!storedUserId || isNewSession()) {
        // Generate new user ID
        userId = generateUserId();
        localStorage.setItem('survey_user_id', userId);
        localStorage.setItem('session_start', sessionStartTime.toISOString());
    } else {
        userId = storedUserId;
    }
}

/**
 * Check if this is a new session (different day or after 4 hours)
 */
function isNewSession() {
    const lastSession = localStorage.getItem('session_start');
    if (!lastSession) return true;
    
    const lastSessionTime = new Date(lastSession);
    const hoursDiff = (sessionStartTime - lastSessionTime) / (1000 * 60 * 60);
    
    // New session if more than 4 hours ago or different day
    return hoursDiff > 4 || 
           lastSessionTime.toDateString() !== sessionStartTime.toDateString();
}

/**
 * Generate unique user ID
 */
function generateUserId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `user_${timestamp}_${random}`;
}

/**
 * Show loading indicator
 */
function showLoadingIndicator(message = 'Zpracovávám data...') {
    const indicator = document.getElementById('loading-indicator');
    const text = document.getElementById('loading-text');
    
    if (indicator && text) {
        text.textContent = message;
        indicator.classList.add('show');
    }
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    
    if (indicator) {
        indicator.classList.remove('show');
    }
}

/**
 * Track an event to Google Sheets
 */
async function trackEvent(eventType, additionalData = {}) {
    if (!TRACKING_API_URL || TRACKING_API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.log('Tracking disabled - no API URL configured');
        return;
    }
    
    // Show loading indicator with specific message
    let loadingMessage = 'Zpracovávám data...';
    switch (eventType) {
        case 'page_load':
        case 'restart':
            loadingMessage = 'Připojuji se...';
            break;
        case 'survey_start':
            loadingMessage = 'Zahajuji anketu...';
            break;
        case 'survey_complete':
            loadingMessage = 'Ukládám výsledky...';
            break;
    }
    
    showLoadingIndicator(loadingMessage);
    
    try {
        const payload = {
            userId: userId,
            eventType: eventType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...additionalData
        };
        
        const response = await fetch(TRACKING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'no-cors' // Required for Google Apps Script
        });
        
        console.log(`Event tracked: ${eventType} for user ${userId}`);
        
        // Small delay to ensure user sees the feedback (except for initial load)
        if (eventType !== 'page_load') {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
    } catch (error) {
        console.error('Error tracking event:', error);
        // Don't throw error to avoid breaking the app
    } finally {
        hideLoadingIndicator();
    }
}



// Přidání funkce exportu do konzole (pro debugging)
window.exportResults = exportResults;
window.calculatePartyMatches = calculatePartyMatches;
window.trackEvent = trackEvent; // For manual testing

// Obnovení stavu při načtení stránky
document.addEventListener('DOMContentLoaded', restoreState); 