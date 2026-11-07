# Local dev launcher.
#
# `vercel dev` does not reliably inject .env.local into serverless functions,
# so we load those vars into THIS PowerShell process first. The `npx vercel dev`
# child process then inherits them -- that's how process.env.DATABASE_URL
# reaches your function locally.
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
        $name  = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        Write-Host "loaded env: $name"
    }
}

npx vercel dev
