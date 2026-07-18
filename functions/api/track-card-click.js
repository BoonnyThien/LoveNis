// API endpoint để theo dõi clicks trên các card
export async function onRequestPost(context) {
    const { request, env } = context

    try {
        const { sessionId, cardId, cardLetter, projectVersion } = await request.json()

        if (!sessionId || !cardId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        // Ghi log click
        await env.DB.prepare(`
      INSERT INTO card_clicks (session_id, card_id, card_letter, project)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, cardId, cardLetter || '', projectVersion || 'Happy New Year').run()

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Card click tracked'
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
        console.error('❌ Card click tracking error:', error)
        return new Response(
            JSON.stringify({
                error: 'Failed to track click',
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
