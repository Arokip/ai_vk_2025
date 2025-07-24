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
    
    // Create initial user record (only if new user/session) - fire and forget
    trackEvent('page_load');
    
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
function startQuiz() {
    if (isLoading || !quizData) {
        showLoadingIndicator('Data se načítají...');
        return;
    }
    
    // Track survey start (fire and forget)
    surveyStartTime = new Date();
    trackEvent('survey_start', {
        sessionStart: surveyStartTime.toISOString(),
        totalQuestions: quizData.questions.length
    });
    
    // Continue immediately without waiting for tracking
    currentQuestionIndex = 0;
    document.getElementById('intro-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'block';
    
    showQuestion(currentQuestionIndex);
    updateProgress();
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
            
            ${index >= 9 ? `
                <div class="early-finish-container">
                    <button class="early-finish-button" onclick="showResults()">
                        📊 Zobrazit výsledky nyní
                    </button>
                    <div class="early-finish-note">
                        Máte dostatek odpovědí pro smysluplné výsledky
                    </div>
                </div>
            ` : ''}
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
    
    // Only calculate for questions that have been seen (up to current index + 1)
    const questionsToCalculate = Math.min(currentQuestionIndex + 1, quizData.questions.length);
    
    // Výpočet skóre pro každou otázku
    quizData.questions.slice(0, questionsToCalculate).forEach((question, questionIndex) => {
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
function showResults() {
    // Skrytí sekce s otázkami
    document.getElementById('quiz-section').style.display = 'none';
    
    // Výpočet výsledků
    const results = calculatePartyMatches();
    
    // Calculate completion statistics
    const questionsAnswered = Math.min(currentQuestionIndex + 1, quizData.questions.length);
    const totalQuestions = quizData.questions.length;
    const completionRate = Math.round((questionsAnswered / totalQuestions) * 100);
    const answeredQuestions = userAnswers.slice(0, questionsAnswered).filter(answer => 
        answer && (answer.agreement !== 50 || answer.importance !== 50)
    ).length;
    const isEarlyFinish = questionsAnswered < totalQuestions;
    
    // Calculate session duration
    const sessionDuration = surveyStartTime ? 
        Math.round((new Date() - surveyStartTime) / 1000) : 0;
    
    // Track survey completion (fire and forget)
    trackEvent(isEarlyFinish ? 'survey_early_finish' : 'survey_complete', {
        results: results,
        sessionDuration: sessionDuration,
        questionsAnswered: questionsAnswered,
        answeredQuestions: answeredQuestions,
        totalQuestions: totalQuestions,
        completionRate: completionRate,
        earlyFinish: isEarlyFinish
    });
    
    // Continue immediately without waiting for tracking
    // Zobrazení sekce s výsledky
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    
    // Add completion info header
    const completionInfo = isEarlyFinish ? `
        <div class="completion-info">
            <div class="completion-stats">
                <span class="completion-rate">Dokončeno: ${completionRate}% (${questionsAnswered}/${totalQuestions} otázek)</span>
                <span class="answered-count">Aktivně zodpovězeno: ${answeredQuestions} otázek</span>
            </div>
            <div class="completion-note">
                Výsledky jsou vypočítány na základě vašich dosavadních odpovědí. 
                ${answeredQuestions >= 5 ? 'Máte dostatek odpovědí pro reprezentativní výsledky.' : 'Pro přesnější výsledky doporučujeme zodpovědět více otázek.'}
            </div>
        </div>
    ` : `
        <div class="completion-info">
            <div class="completion-stats">
                <span class="completion-rate">✅ Anketa dokončena (${totalQuestions}/${totalQuestions} otázek)</span>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = completionInfo + results.map((result, index) => `
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
    const resultData = {
        results: results,
        completionRate: completionRate,
        questionsAnswered: questionsAnswered,
        answeredQuestions: answeredQuestions,
        isEarlyFinish: isEarlyFinish,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('quizResults', JSON.stringify(resultData));
    
    // Scroll na začátek výsledků
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Restart ankety
function restartQuiz() {
    // Vymazání uložených dat
    localStorage.removeItem('userAnswers');
    localStorage.removeItem('quizResults');
    
    // Reset tracking
    surveyStartTime = null;
    
    // Generate new user ID for new session
    initializeUserTracking();
    
    // Track restart (this creates a new record) - fire and forget
    trackEvent('restart');
    
    // Continue immediately without waiting for tracking
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
 * Track an event to Google Sheets (fire-and-forget, non-blocking)
 */
function trackEvent(eventType, additionalData = {}) {
    if (!TRACKING_API_URL || TRACKING_API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.log('Tracking disabled - no API URL configured');
        return;
    }
    
    // Fire-and-forget - don't await or block the UI
    const payload = {
        userId: userId,
        eventType: eventType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...additionalData
    };
    
    fetch(TRACKING_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Required for Google Apps Script
    }).then(() => {
        console.log(`Event tracked: ${eventType} for user ${userId}`);
    }).catch(error => {
        console.error('Error tracking event:', error);
        // Don't throw error to avoid breaking the app
    });
}



// === AI DISCLOSURE FUNCTIONS ===

/**
 * Show AI disclosure modal
 */
function showAiDisclosure() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
        modal.classList.add('show');
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide AI disclosure modal
 */
function hideAiDisclosure(event) {
    // If event is provided, check if clicked outside modal content
    if (event && event.target !== event.currentTarget) {
        return;
    }
    
    const modal = document.getElementById('ai-modal');
    if (modal) {
        modal.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Přidání funkce exportu do konzole (pro debugging)
window.exportResults = exportResults;
window.calculatePartyMatches = calculatePartyMatches;
window.trackEvent = trackEvent; // For manual testing
window.showAiDisclosure = showAiDisclosure; // For manual testing
window.hideAiDisclosure = hideAiDisclosure; // For manual testing

// Obnovení stavu při načtení stránky
document.addEventListener('DOMContentLoaded', restoreState); 