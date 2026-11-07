
export async function submitScore (name, score)
{
    try
    {
        const res = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });
        return res.ok;
    }
    catch (err)
    {
        console.warn('submitScore failed:', err);
        return false;
    }
}

export async function getLeaderboard ()
{
    try
    {
        const res = await fetch('/api/scores');
        if (!res.ok) return [];
        return await res.json();
    }
    catch (err)
    {
        console.warn('getLeaderboard failed:', err);
        return [];
    }
}
