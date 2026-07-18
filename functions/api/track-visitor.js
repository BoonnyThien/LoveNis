// API endpoint để theo dõi thông tin người dùng
export async function onRequestPost(context) {
    const { request, env } = context

    try {
        // Parse dữ liệu từ client
        const data = await request.json()
        const {
            sessionId,
            deviceType,
            browser,
            os,
            screenWidth,
            screenHeight,
            language,
            timezone,
            referrer,
            projectVersion,
            isExit
        } = data

        // Lấy thông tin từ Cloudflare
        const ip = request.headers.get('cf-connecting-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        const cf = request.cf || {}

        // Kiểm tra xem session đã tồn tại chưa
        const existing = await env.DB.prepare(
            'SELECT id, visit_count FROM visitor_logs WHERE session_id = ?'
        ).bind(sessionId).first()

        if (existing) {
            if (isExit) {
                // Chỉ cập nhật thời gian thoát, không tăng count
                await env.DB.prepare(`
                    UPDATE visitor_logs 
                    SET last_visit = CURRENT_TIMESTAMP
                    WHERE session_id = ?
                `).bind(sessionId).run()
            } else {
                // Cập nhật lượt truy cập và thời gian
                await env.DB.prepare(`
                    UPDATE visitor_logs 
                    SET last_visit = CURRENT_TIMESTAMP,
                        visit_count = visit_count + 1
                    WHERE session_id = ?
                `).bind(sessionId).run()
            }
        } else {
            // Tạo record mới (chỉ khi không phải là exit event - phòng trường hợp exit được gửi nhưng session chưa được tạo, dù hiếm)
            // Hoặc cứ tạo nếu chưa có code logic nào khác chặn
            await env.DB.prepare(`
                INSERT INTO visitor_logs (
                  session_id, ip, user_agent, device_type, browser, os,
                  screen_width, screen_height, language, timezone,
                  country, city, region, referrer, project
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                sessionId,
                ip,
                userAgent,
                deviceType,
                browser,
                os,
                screenWidth,
                screenHeight,
                language,
                timezone,
                cf.country || 'unknown',
                cf.city || 'unknown',
                cf.region || 'unknown',
                referrer || 'direct',
                `Happy New Year v${projectVersion || '1.0.0'}`
            ).run()
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Visitor tracked successfully',
                sessionId
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )

    } catch (error) {
        console.error('❌ Visitor tracking error:', error)
        return new Response(
            JSON.stringify({
                error: 'Failed to track visitor',
                details: error.message
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
}

// CORS handler
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    })
}
