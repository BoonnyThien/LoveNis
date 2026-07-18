// Utility functions for analytics tracking
// Không ảnh hưởng đến Cloudflare Web Analytics

const PROJECT_VERSION = 'Happy Lunar New Year v1' // Increment this when deploying new version
const STORAGE_VERSION_KEY = 'visitor_project_version'
const STORAGE_SESSION_KEY = 'visitor_session_id'

// Tạo hoặc lấy session ID
export function getSessionId(): string {
    // Check version first
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
    if (storedVersion !== PROJECT_VERSION) {
        // Version changed, reset session to force new line in DB
        localStorage.removeItem(STORAGE_SESSION_KEY)
        localStorage.setItem(STORAGE_VERSION_KEY, PROJECT_VERSION)
    }

    let sessionId = localStorage.getItem(STORAGE_SESSION_KEY)

    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(STORAGE_SESSION_KEY, sessionId)
    }

    return sessionId
}

// Lấy thông tin thiết bị
export function getDeviceInfo() {
    const ua = navigator.userAgent

    // Detect device type
    let deviceType = 'desktop'
    if (/mobile/i.test(ua)) deviceType = 'mobile'
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

    // Detect browser
    let browser = 'unknown'
    if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edge')) browser = 'Edge'

    // Detect OS
    let os = 'unknown'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'MacOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    return {
        deviceType,
        browser,
        os,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer,
        projectVersion: PROJECT_VERSION
    }
}

// Gửi thông tin visitor đến API
export async function trackVisitor(isExit = false) {
    try {
        const sessionId = getSessionId()
        const deviceInfo = getDeviceInfo()

        // Use keepalive for exit events to ensure they complete
        const fetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                ...deviceInfo,
                isExit
            })
        }

        if (isExit) {
            fetchOptions.keepalive = true
        }

        const response = await fetch('/api/track-visitor', fetchOptions)

        if (!response.ok && !isExit) {
            console.warn('Failed to track visitor:', await response.text())
        }
    } catch (error) {
        // Suppress errors for exit events as interactions might be terminated
        if (!isExit) {
            console.warn('Visitor tracking error:', error)
        }
    }
}

// Setup listeners for exit/heartbeat
export function setupAnalyticsListeners() {
    // Track when user leaves
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            trackVisitor(true)
        }
    })

    // Backup for closing tab
    window.addEventListener('beforeunload', () => {
        trackVisitor(true)
    })
}

// Track card click
export async function trackCardClick(cardId: number, cardLetter: string) {
    try {
        const sessionId = getSessionId()

        await fetch('/api/track-card-click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                cardId,
                cardLetter,
                projectVersion: PROJECT_VERSION
            })
        })
    } catch (error) {
        console.warn('Card click tracking error:', error)
        // Không throw error
    }
}
