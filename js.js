// public/js.js

// --- Constants & DOM Elements ---
const backendAPI = 'http://localhost:3000/api/jobs'; // Ensure this matches your Node.js server port

// Selectors for loading and job listing
const loadingIndicator = document.getElementById('loadingIndicator');
const jobList = document.getElementById('jobList');
const jobFilterForm = document.getElementById('jobFilterForm');

// Selectors for pagination
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const totalJobsSpan = document.getElementById('totalJobs');

// Filter input elements
const searchTitleInput = document.getElementById('searchTitle');
const searchLocationInput = document.getElementById('searchLocation');
const searchTypeSelect = document.getElementById('searchType');

// View management
const navJobSeeker = document.getElementById('navJobSeeker');
const navEmployer = document.getElementById('navEmployer');
const jobSeekerView = document.getElementById('jobSeekerView');
const employerView = document.getElementById('employerView');

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');

// Login/Signup modals
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// --- State Variables ---
let currentPage = 1;
const jobsPerPage = 9; // Matches backend limit
let totalPages = 1;
let isLoading = false; // Prevents multiple simultaneous fetch requests

// --- Utility Functions ---

function setLoading(show) {
    isLoading = show;
    loadingIndicator.style.display = show ? 'flex' : 'none';
    loadingIndicator.setAttribute('aria-busy', show);
    jobFilterForm.querySelector('button[type="submit"]').disabled = show;
    prevPageBtn.disabled = show || currentPage <= 1;
    nextPageBtn.disabled = show || currentPage >= totalPages;
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function displayError(message, targetElement) {
    if (targetElement) {
        targetElement.textContent = message;
        targetElement.style.display = 'block';
    } else {
        console.error('Error:', message);
        alert('An error occurred: ' + message);
    }
}

function hideError(targetElement) {
    if (targetElement) {
        targetElement.textContent = '';
        targetElement.style.display = 'none';
    }
}

// --- Data Fetching ---

async function fetchJobs(query = '', location = '', type = '', page = 1) {
    setLoading(true);
    hideError(jobList.querySelector('.alert-danger'));

    try {
        const url = new URL(backendAPI);
        url.searchParams.append('search', query);
        url.searchParams.append('location', location);
        url.searchParams.append('job_type', type);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', jobsPerPage);

        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Failed to fetch jobs: ${res.status} ${errorData.message || res.statusText}`);
        }

        return await res.json();
    } catch (error) {
        console.error('FetchJobs error:', error);
        displayError('Could not load jobs: ' + error.message + '. Please try again.', jobList);
        jobList.innerHTML = `<p class="alert alert-danger text-center w-100">${error.message}. Please check your network connection or server status.</p>`;
        return { jobs: [], totalPages: 1, totalJobs: 0 };
    } finally {
        setLoading(false);
    }
}

// --- UI Rendering ---

function renderJobs(jobs) {
    jobList.innerHTML = '';
    if (jobs.length === 0) {
        jobList.innerHTML = `<p class="text-center fs-5 text-muted col-12">No jobs found matching your criteria.</p>`;
        return;
    }

    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'col-md-6 col-lg-4 d-flex';
        const descriptionSnippet = (job.description || 'No description provided.').replace(/<[^>]+>/g, '').substring(0, 150) + '...';
        const companyName = job.company_name || job.company || 'Confidential Company';
        const location = job.candidate_required_location || job.location || 'N/A';
        const jobType = job.job_type || job.type || 'N/A';

        jobCard.innerHTML = `
            <div class="card job-card w-100 p-3">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${job.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${companyName}</h6>
                    <p class="mb-1 text-secondary-emphasis"><i class="bi bi-geo-alt-fill text-primary me-2"></i><strong>Location:</strong> ${location}</p>
                    <p class="mb-1 text-secondary-emphasis"><i class="bi bi-briefcase-fill text-primary me-2"></i><strong>Type:</strong> ${jobType}</p>
                    <p class="card-text flex-grow-1 text-muted">${descriptionSnippet}</p>
                    <a href="${job.url || '#'}" class="btn btn-gradient mt-auto" target="_blank" rel="noopener noreferrer" aria-label="Apply for job: ${job.title}">Apply Now</a>
                </div>
            </div>`;
        jobList.appendChild(jobCard);
    });
}

function updateUrlParams() {
    const params = new URLSearchParams();
    const title = searchTitleInput.value.trim();
    const location = searchLocationInput.value.trim();
    const type = searchTypeSelect.value;

    if (title) params.set('search', title);
    if (location) params.set('location', location);
    if (type) params.set('job_type', type);
    if (currentPage !== 1) params.set('page', currentPage);

    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
}

function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    searchTitleInput.value = params.get('search') || '';
    searchLocationInput.value = params.get('location') || '';
    searchTypeSelect.value = params.get('job_type') || '';
    currentPage = parseInt(params.get('page')) || 1;
}

// --- Main Job Loading Logic ---

async function loadJobs(page = currentPage) {
    if (isLoading) return;

    const titleFilter = searchTitleInput.value.trim();
    const locationFilter = searchLocationInput.value.trim();
    const typeFilter = searchTypeSelect.value;

    currentPage = page;
    updateUrlParams();

    const data = await fetchJobs(titleFilter, locationFilter, typeFilter, currentPage);

    renderJobs(data.jobs);

    totalPages = data.totalPages || 1;
    currentPageSpan.textContent = data.currentPage;
    totalPagesSpan.textContent = totalPages;
    totalJobsSpan.textContent = data.totalJobs || 0;

    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// --- Dynamic Content Loading (About Section) ---
async function loadAboutContent() {
    const aboutContentDiv = document.getElementById('aboutContent');
    const content = `
        <div class="col-md-6 mb-4 mb-md-0">
            <h3 class="fw-bold mb-3 text-secondary-emphasis">Our Mission</h3>
            <p>At ISeekJoB, we believe that everyone deserves to find a fulfilling career. Our mission is to connect talented individuals with the best job opportunities worldwide, simplifying the job search process for job seekers and streamlining recruitment for employers.</p>
            <h3 class="fw-bold mb-3 text-secondary-emphasis">What We Offer</h3>
            <ul class="list-unstyled">
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Vast database of job listings from various industries.</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Advanced filtering and search options to pinpoint your ideal role.</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>User-friendly interface for a seamless experience.</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Dedicated employer portal (coming soon!) to simplify hiring.</li>
            </ul>
        </div>
        <div class="col-md-6 d-flex justify-content-center align-items-center">
            <img src="https://via.placeholder.com/500x300?text=About+ISeekJoB" class="img-fluid rounded shadow-lg" alt="Team working illustration">
        </div>
    `;
    aboutContentDiv.innerHTML = content;
}

// --- Event Listeners ---

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        loadJobs(currentPage - 1);
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
        loadJobs(currentPage + 1);
    }
});

jobFilterForm.addEventListener('submit', e => {
    e.preventDefault();
    currentPage = 1;
    loadJobs(currentPage);
});

const debouncedLoadJobs = debounce(() => {
    currentPage = 1;
    loadJobs(currentPage);
}, 500);

searchTitleInput.addEventListener('input', debouncedLoadJobs);
searchLocationInput.addEventListener('input', debouncedLoadJobs);
searchTypeSelect.addEventListener('change', () => {
    currentPage = 1;
    loadJobs(currentPage);
});

// Navbar view switching
function switchView(viewToShow, navLinkToActivate) {
    const allViewSections = document.querySelectorAll('.view-section');
    allViewSections.forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    viewToShow.classList.add('active');
    viewToShow.style.display = 'block';

    const allNavLinks = document.querySelectorAll('.navbar-nav .nav-link');
    allNavLinks.forEach(link => link.classList.remove('active'));
    navLinkToActivate.classList.add('active');

    window.location.hash = navLinkToActivate.getAttribute('href').substring(1);
}

navJobSeeker.addEventListener('click', e => {
    e.preventDefault();
    switchView(jobSeekerView, navJobSeeker);
});

navEmployer.addEventListener('click', e => {
    e.preventDefault();
    switchView(employerView, navEmployer);
});

// --- Modals (Login/Signup Simulation) ---
loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    hideError(loginError);

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email === 'user@example.com' && password === 'password') {
            alert('Login successful!');
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();
            loginForm.reset();
        } else {
            displayError('Invalid email or password. Please try again.', loginError);
        }
    } catch (error) {
        displayError('An error occurred during login. Please try again later.', loginError);
        console.error('Login error:', error);
    }
});

signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    hideError(signupError);

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (password.length < 6) {
        displayError('Password must be at least 6 characters long.', signupError);
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email.includes('@') && email.includes('.')) {
            alert('Sign up successful! Please log in.');
            const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
            if (signupModal) signupModal.hide();
            signupForm.reset();
        } else {
            displayError('Invalid email format. Please check your email.', signupError);
        }
    } catch (error) {
        displayError('An error occurred during sign up. Please try again later.', signupError);
        console.error('Sign up error:', error);
    }
});

// --- Dark Mode Functionality ---
function setDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    darkModeToggle.checked = isDark;
    localStorage.setItem('darkMode', isDark);
}

darkModeToggle.addEventListener('change', e => {
    setDarkMode(e.target.checked);
});

const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode !== null) {
    setDarkMode(savedDarkMode === 'true');
} else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
}

// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    applyUrlParams();
    loadJobs(currentPage);
    loadAboutContent();

    if (window.location.hash === '#employerView') {
        switchView(employerView, navEmployer);
    } else {
        switchView(jobSeekerView, navJobSeeker);
    }
});
