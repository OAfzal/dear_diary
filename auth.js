// GitHub Authentication Module

class GitHubAuth {
    constructor() {
        this.token = localStorage.getItem('github_token');
        this.user = null;
        this.gistId = localStorage.getItem('gist_id');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Get current user info
    async getCurrentUser() {
        if (!this.token) return null;
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
                return this.user;
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            throw error;
        }
    }

    // Check if current user is authorized
    async isAuthorizedUser() {
        const user = await this.getCurrentUser();
        return user && user.login === GITHUB_CONFIG.AUTHORIZED_USER;
    }

    // Start OAuth flow
    login() {
        const authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${GITHUB_CONFIG.CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(GITHUB_CONFIG.REDIRECT_URI)}&` +
            `scope=${GITHUB_CONFIG.SCOPE}&` +
            `state=${Math.random().toString(36).substring(7)}`;
        
        window.location.href = authUrl;
    }

    // Handle OAuth callback
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) return false;
        
        try {
            // Exchange code for token using GitHub's device flow
            // Note: For client-side apps, we'll use a proxy service or ask user to create a personal access token
            // For now, we'll use the personal access token approach
            this.showTokenInput();
            return true;
        } catch (error) {
            console.error('OAuth error:', error);
            return false;
        }
    }

    // Show token input for manual setup
    showTokenInput() {
        const tokenInput = document.getElementById('token-input');
        const tokenSection = document.getElementById('token-section');
        
        if (tokenSection) {
            tokenSection.style.display = 'block';
        }
    }

    // Set token manually
    async setToken(token) {
        this.token = token;
        localStorage.setItem('github_token', token);
        
        // Verify token and user
        try {
            const user = await this.getCurrentUser();
            
            if (user && user.login === GITHUB_CONFIG.AUTHORIZED_USER) {
                this.hideTokenInput();
                return true;
            } else {
                this.logout();
                if (!user) {
                    throw new Error('Invalid token');
                } else {
                    throw new Error('Unauthorized user');
                }
            }
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    // Hide token input
    hideTokenInput() {
        const tokenSection = document.getElementById('token-section');
        if (tokenSection) {
            tokenSection.style.display = 'none';
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        this.gistId = null;
        localStorage.removeItem('github_token');
        localStorage.removeItem('gist_id');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Reload page to show login
        window.location.reload();
    }

    // Get or create data gist
    async getOrCreateDataGist() {
        if (this.gistId) {
            // Try to get existing gist
            try {
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.error('Error fetching gist:', error);
            }
        }
        
        // Create new gist
        const initialData = {
            weightData: {},
            calorieData: {},
            diaryData: {},
            lastUpdated: new Date().toISOString()
        };
        
        const gistData = {
            description: 'Personal Tracker Data',
            public: false,
            files: {
                [GITHUB_CONFIG.GIST_FILENAME]: {
                    content: JSON.stringify(initialData, null, 2)
                }
            }
        };
        
        try {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                const gist = await response.json();
                this.gistId = gist.id;
                localStorage.setItem('gist_id', this.gistId);
                return gist;
            }
        } catch (error) {
            console.error('Error creating gist:', error);
        }
        
        throw new Error('Failed to create data gist');
    }

    // Load data from gist
    async loadData() {
        try {
            const gist = await this.getOrCreateDataGist();
            const fileContent = gist.files[GITHUB_CONFIG.GIST_FILENAME].content;
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error loading data:', error);
            return {
                weightData: {},
                calorieData: {},
                diaryData: {},
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Save data to gist
    async saveData(data) {
        if (!this.gistId) {
            await this.getOrCreateDataGist();
        }
        
        const updatedData = {
            ...data,
            lastUpdated: new Date().toISOString()
        };
        
        const gistData = {
            files: {
                [GITHUB_CONFIG.GIST_FILENAME]: {
                    content: JSON.stringify(updatedData, null, 2)
                }
            }
        };
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
        
        throw new Error('Failed to save data');
    }
}

// Global auth instance
const githubAuth = new GitHubAuth();