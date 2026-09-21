[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$ErrorActionPreference = 'Stop'

function Print-Headers($headers) {
  foreach ($h in $headers.GetEnumerator()) {
    Write-Host "$($h.Name): $($h.Value)"
  }
}

try {
  try {
    $r = Invoke-WebRequest -Uri 'https://localhost:4321/temp/build/manifests.js' -Method OPTIONS -UseBasicParsing -ErrorAction Stop
    Write-Host "OPTIONS Status: $($r.StatusCode)"
    Write-Host "----OPTIONS HEADERS----"
    Print-Headers $r.Headers
  } catch {
    Write-Host "OPTIONS ERROR: $($_.Exception.Message)"
  }

  try {
    $g = Invoke-WebRequest -Uri 'https://localhost:4321/temp/build/manifests.js' -UseBasicParsing -ErrorAction Stop
    Write-Host "GET Status: $($g.StatusCode)"
    Write-Host "----GET HEADERS----"
    Print-Headers $g.Headers
    Write-Host "----GET BODY FIRST LINES----"
    $g.Content -split "`n" | Select-Object -First 10 | ForEach-Object { Write-Host $_ }
  } catch {
    Write-Host "GET ERROR: $($_.Exception.Message)"
  }
} catch {
  Write-Host "SCRIPT ERROR: $($_.Exception.Message)"
}
