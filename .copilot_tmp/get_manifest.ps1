[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
try {
  $r = Invoke-WebRequest -Uri 'https://localhost:4321/temp/build/manifests.js' -UseBasicParsing -ErrorAction Stop
  Write-Host "Status: $($r.StatusCode)"
  Write-Host "----HEADERS----"
  foreach ($h in $r.Headers.GetEnumerator()) { Write-Host "$($h.Name): $($h.Value)" }
  Write-Host "----BODY----"
  $r.Content -split "`n" | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
}
