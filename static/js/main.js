/* Main Frontend Logic - Google Cloud BigQuery Release Notes Tracker */

document.addEventListener('DOMContentLoaded', () => {
    // State
    let releaseNotesData = [];
    let currentFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const spinner = document.getElementById('spinner');
    const searchInput = document.getElementById('search-input');
    const filterPills = document.getElementById('filter-pills');
    const lastCheckedTimeEl = document.getElementById('last-checked-time');
    const totalUpdatesCountEl = document.getElementById('total-updates-count');
    const timelineEl = document.getElementById('notes-timeline');
    const loadingStateEl = document.getElementById('feed-loading');
    const errorStateEl = document.getElementById('feed-error');
    const emptyStateEl = document.getElementById('feed-empty');
    const errorMessageEl = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const toastContainer = document.getElementById('toast-container');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // Initialize Theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    exportCsvBtn.addEventListener('click', exportToCSV);

    themeToggleBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
            showSuccessToast('Switched to Dark Mode');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
            showSuccessToast('Switched to Light Mode');
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTimeline();
    });

    filterPills.addEventListener('click', (e) => {
        const clickedPill = e.target.closest('.pill');
        if (!clickedPill) return;

        // Toggle Active State
        filterPills.querySelectorAll('.pill').forEach(pill => pill.classList.remove('active'));
        clickedPill.classList.add('active');

        currentFilter = clickedPill.dataset.filter;
        renderTimeline();
    });

    // Initialize
    fetchReleaseNotes();

    // Fetch API Data
    async function fetchReleaseNotes() {
        showLoadingState();
        try {
            const response = await fetch('/api/release-notes');
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Server responded with status ${response.status}`);
            }

            releaseNotesData = result.data;
            updateDashboardMeta();
            renderTimeline();
            showSuccessToast('Release notes successfully updated!');
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState(error.message);
            showErrorToast('Failed to fetch release notes.');
        }
    }

    // Render Timeline & Cards
    function renderTimeline() {
        // Clear timeline
        timelineEl.innerHTML = '';
        
        let filteredCount = 0;
        let totalItemsCount = 0;

        // Group cards by date
        releaseNotesData.forEach(entry => {
            // Filter items within the entry
            const matchingItems = entry.items.filter(item => {
                // Category Filter
                let matchesCategory = false;
                if (currentFilter === 'all') {
                    matchesCategory = true;
                } else if (currentFilter === 'Other') {
                    // Other matches categories that are not Feature, Changed, or Deprecated
                    matchesCategory = !['Feature', 'Changed', 'Deprecated'].includes(item.type);
                } else {
                    matchesCategory = item.type === currentFilter;
                }

                // Search Filter
                const matchesSearch = item.plain_text.toLowerCase().includes(searchQuery) || 
                                      item.type.toLowerCase().includes(searchQuery) ||
                                      entry.date.toLowerCase().includes(searchQuery);

                return matchesCategory && matchesSearch;
            });

            if (matchingItems.length > 0) {
                filteredCount += matchingItems.length;

                // Create Timeline Group for this Date
                const timelineGroup = document.createElement('div');
                timelineGroup.className = 'timeline-group';

                // Date column
                const dateContainer = document.createElement('div');
                dateContainer.className = 'timeline-date-container';
                dateContainer.innerHTML = `
                    <div class="timeline-date-sticky">
                        <div class="timeline-dot"></div>
                        <div class="timeline-date-text">${entry.date}</div>
                    </div>
                `;
                timelineGroup.appendChild(dateContainer);

                // Cards list column
                const cardsList = document.createElement('div');
                cardsList.className = 'timeline-cards-list';

                matchingItems.forEach(item => {
                    totalItemsCount++;
                    const card = createCardElement(entry.date, item);
                    cardsList.appendChild(card);
                });

                timelineGroup.appendChild(cardsList);
                timelineEl.appendChild(timelineGroup);
            }
        });

        // Toggle Empty/Timeline states
        if (filteredCount === 0) {
            if (releaseNotesData.length === 0) {
                // Feed is empty overall
                showEmptyState("No release notes available at the moment.");
            } else {
                // Filter returned empty
                showEmptyState("No matching release notes found for the current filters.");
            }
        } else {
            showTimelineState();
        }
    }

    // Create Card DOM Element
    function createCardElement(dateStr, item) {
        const card = document.createElement('div');
        
        // Match CSS categories
        let typeClass = 'type-other';
        const typeNormalized = item.type.toLowerCase();
        if (typeNormalized.includes('feature')) {
            typeClass = 'type-feature';
        } else if (typeNormalized.includes('change') || typeNormalized.includes('update')) {
            typeClass = 'type-changed';
        } else if (typeNormalized.includes('deprecat')) {
            typeClass = 'type-deprecated';
        }

        card.className = `release-card ${typeClass}`;
        
        // Add ID if unique
        const uniqueId = `card-${Math.random().toString(36).substr(2, 9)}`;
        card.id = uniqueId;

        // Set card structure
        card.innerHTML = `
            <div class="card-header">
                <span class="type-tag">${item.type}</span>
            </div>
            <div class="release-body">
                ${item.html_content}
            </div>
            <div class="card-actions">
                <button class="btn-copy" aria-label="Copy this update to clipboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy</span>
                </button>
                <button class="btn-tweet" aria-label="Tweet this update">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Tweet Update</span>
                </button>
            </div>
        `;

        // Event listener for copy button
        const copyBtn = card.querySelector('.btn-copy');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(item.plain_text)
                .then(() => {
                    showSuccessToast('Update copied to clipboard!');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    showErrorToast('Failed to copy text.');
                });
        });

        // Event listener for tweet button
        const tweetBtn = card.querySelector('.btn-tweet');
        tweetBtn.addEventListener('click', () => {
            tweetUpdate(dateStr, item);
        });

        return card;
    }

    // Twitter Integration (Web Intent)
    function tweetUpdate(dateStr, item) {
        const maxSnippetLength = 145; // Leave space for headers, tags, links
        let snippet = item.plain_text;
        
        if (snippet.length > maxSnippetLength) {
            snippet = snippet.substring(0, maxSnippetLength).trim() + '...';
        }

        const tweetText = `📢 BigQuery Update (${dateStr}):\n"${snippet}"\n\n#GoogleCloud #BigQuery\nhttps://docs.cloud.google.com/bigquery/docs/release-notes`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        
        window.open(tweetUrl, '_blank', 'width=550,height=420');
        showSuccessToast('Opening Twitter to share this update!');
    }

    // UI State Management Helpers
    function showLoadingState() {
        loadingStateEl.classList.remove('hidden');
        errorStateEl.classList.add('hidden');
        emptyStateEl.classList.add('hidden');
        timelineEl.classList.add('hidden');
        refreshBtn.disabled = true;
        spinner.classList.remove('hidden');
    }

    function showErrorState(message) {
        loadingStateEl.classList.add('hidden');
        errorStateEl.classList.remove('hidden');
        emptyStateEl.classList.add('hidden');
        timelineEl.classList.add('hidden');
        errorMessageEl.textContent = message;
        refreshBtn.disabled = false;
        spinner.classList.add('hidden');
    }

    function showEmptyState(msg) {
        loadingStateEl.classList.add('hidden');
        errorStateEl.classList.add('hidden');
        emptyStateEl.classList.remove('hidden');
        if (msg) {
            emptyStateEl.querySelector('p').textContent = msg;
        }
        timelineEl.classList.add('hidden');
        refreshBtn.disabled = false;
        spinner.classList.add('hidden');
    }

    function showTimelineState() {
        loadingStateEl.classList.add('hidden');
        errorStateEl.classList.add('hidden');
        emptyStateEl.classList.add('hidden');
        timelineEl.classList.remove('hidden');
        refreshBtn.disabled = false;
        spinner.classList.add('hidden');
    }

    // Dashboard Meta Updates
    function updateDashboardMeta() {
        // Last checked time
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastCheckedTimeEl.textContent = timeString;

        // Total updates count
        let totalCount = 0;
        releaseNotesData.forEach(entry => {
            totalCount += entry.items.length;
        });
        totalUpdatesCountEl.textContent = totalCount;
    }

    // Toast Notifications
    function showSuccessToast(message) {
        showToast(message, 'toast-success');
    }

    function showErrorToast(message) {
        showToast(message, 'toast-error');
    }

    function showToast(message, className = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${className}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow for animation
        toast.offsetHeight;
        
        // Show toast
        toast.classList.add('show');
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 350);
        }, 3000);
    }

    function exportToCSV() {
        if (!releaseNotesData || releaseNotesData.length === 0) {
            showErrorToast('No data available to export.');
            return;
        }

        const csvRows = [['Date', 'Type', 'Description']];

        releaseNotesData.forEach(entry => {
            entry.items.forEach(item => {
                // Apply Category Filter
                let matchesCategory = false;
                if (currentFilter === 'all') {
                    matchesCategory = true;
                } else if (currentFilter === 'Other') {
                    matchesCategory = !['Feature', 'Changed', 'Deprecated'].includes(item.type);
                } else {
                    matchesCategory = item.type === currentFilter;
                }

                // Apply Search Filter
                const matchesSearch = item.plain_text.toLowerCase().includes(searchQuery) || 
                                      item.type.toLowerCase().includes(searchQuery) ||
                                      entry.date.toLowerCase().includes(searchQuery);

                if (matchesCategory && matchesSearch) {
                    const escapedDescription = item.plain_text.replace(/"/g, '""');
                    csvRows.push([
                        `"${entry.date}"`,
                        `"${item.type}"`,
                        `"${escapedDescription}"`
                    ]);
                }
            });
        });

        if (csvRows.length <= 1) {
            showErrorToast('No matching items to export.');
            return;
        }

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const filterStr = currentFilter !== 'all' ? `-${currentFilter.toLowerCase()}` : '';
        const searchStr = searchQuery ? `-${searchQuery.replace(/[^a-z0-9]/gi, '_')}` : '';
        link.setAttribute("download", `bigquery-release-notes${filterStr}${searchStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccessToast('CSV file downloaded successfully!');
    }
});
