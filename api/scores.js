//  Leaderboard API -- one function, two methods:
//      GET  /api/scores   -> top 10 scores (for the leaderboard)
//      POST /api/scores   -> save a { name, score } result
//
//  The database password lives in the DATABASE_URL environment variable, NOT
//  in this file. neon() reads it at runtime. The tagged-template `sql` form
//  (sql`... ${value} ...`) sends values as PARAMETERS, never string-concatenated
//  into the query -- that's what prevents SQL injection.
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler (req, res)
{
    try
    {
        if (req.method === 'POST')
        {
            //  Vercel parses a JSON request body for us into req.body.
            const { name, score } = req.body ?? {};

            //  Validate on the server -- never trust what the browser sends.
            if (typeof name !== 'string' || !Number.isInteger(score))
            {
                return res.status(400).json({ error: 'Expected { name: string, score: integer }' });
            }

            const cleanName = name.trim().slice(0, 16) || 'Player';

            await sql`INSERT INTO scores (name, score) VALUES (${cleanName}, ${score})`;
            return res.status(201).json({ ok: true });
        }

        if (req.method === 'GET')
        {
            const rows = await sql`
                SELECT name, score
                FROM scores
                ORDER BY score DESC, created_at ASC
                LIMIT 10
            `;
            return res.status(200).json(rows);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    }
    catch (err)
    {
        console.error('scores API error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
