// API endpoint để xem thống kê realtime
export async function onRequestGet(context) {
    const { env } = context

    try {
        // Lấy thống kê tổng quan
        const totalVisitors = await env.DB.prepare(
            'SELECT COUNT(DISTINCT session_id) as count FROM visitor_logs'
        ).first()

        const totalClicks = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM card_clicks'
        ).first()

        // Visitors theo quốc gia
        const byCountry = await env.DB.prepare(`
      SELECT country, COUNT(*) as count 
      FROM visitor_logs 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 10
    `).all()

        // Visitors theo device
        const byDevice = await env.DB.prepare(`
      SELECT device_type, COUNT(*) as count 
      FROM visitor_logs 
      GROUP BY device_type
    `).all()

        // Card clicks
        const cardClicks = await env.DB.prepare(`
      SELECT card_letter, COUNT(*) as clicks 
      FROM card_clicks 
      GROUP BY card_letter 
      ORDER BY clicks DESC
    `).all()

        // Recent visitors
        const recentVisitors = await env.DB.prepare(`
      SELECT 
        session_id,
        country,
        city,
        device_type,
        browser,
        first_visit,
        visit_count
      FROM visitor_logs 
      ORDER BY first_visit DESC 
      LIMIT 20
    `).all()

        const stats = {
            overview: {
                totalVisitors: totalVisitors?.count || 0,
                totalClicks: totalClicks?.count || 0
            },
            byCountry: byCountry?.results || [],
            byDevice: byDevice?.results || [],
            cardClicks: cardClicks?.results || [],
            recentVisitors: recentVisitors?.results || []
        }

        return new Response(JSON.stringify(stats, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        })

    } catch (error) {
        console.error('❌ Stats error:', error)
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch stats',
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    })
}
