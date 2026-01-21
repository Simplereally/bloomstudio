# PowerShell script to fix common 'any' type issues in test files

$testFiles = Get-ChildItem -Recurse -Include *.test.ts,*.test.tsx | Where-Object { $_.FullName -notmatch 'node_modules' }

foreach ($file in $testFiles) {
    Write-Host "Processing $($file.Name)..."
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $modified = $false
    
    # Replace @ts-ignore with @ts-expect-error
    if ($content -match '@ts-ignore') {
        $content = $content -replace '@ts-ignore', '@ts-expect-error'
        $modified = $true
    }
    
    # Fix common mock function signatures - simple patterns only
    if ($content -match '\(config: any\)') {
        $content = $content -replace '\(config: any\)', '(config: Record<string, unknown>)'
        $modified = $true
    }
    
    if ($content -match '\(props: any\)') {
        $content = $content -replace '\(props: any\)', '(props: Record<string, unknown>)'
        $modified = $true
    }
    
    if ($content -match '\(name: any\)') {
        $content = $content -replace '\(name: any\)', '(name: string)'
        $modified = $true
    }
    
    if ($content -match '\(status: any\)') {
        $content = $content -replace '\(status: any\)', '(status: number)'
        $modified = $true
    }
    
    if ($content -match '\(err: any\)') {
        $content = $content -replace '\(err: any\)', '(err: Error)'
        $modified = $true
    }
    
    if ($content -match '\(error: any\)') {
        $content = $content -replace '\(error: any\)', '(error: Error)'
        $modified = $true
    }
    
    if ($content -match '\(children: any\)') {
        $content = $content -replace '\(children: any\)', '(children: React.ReactNode)'
        $modified = $true
    }
    
    if ($content -match '\{ children \}: any') {
        $content = $content -replace '\{ children \}: any', '{ children }: { children: React.ReactNode }'
        $modified = $true
    }
    
    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "  Fixed $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
