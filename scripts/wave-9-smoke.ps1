# Wave 9 — production smoke (read-only + safe quote POST)
$ErrorActionPreference = 'Stop'
$api = if ($env:COLIBRI_API_URL) { $env:COLIBRI_API_URL.TrimEnd('/') } else { 'https://colibri-api-djm1.onrender.com' }
$web = if ($env:COLIBRI_WEB_URL) { $env:COLIBRI_WEB_URL.TrimEnd('/') } else { 'https://colibri-web-lovat.vercel.app' }
$results = @()

function Test-Endpoint($name, $scriptBlock) {
  try {
    & $scriptBlock
    $script:results += [pscustomobject]@{ Check = $name; Ok = $true; Detail = 'OK' }
  } catch {
    $script:results += [pscustomobject]@{ Check = $name; Ok = $false; Detail = $_.Exception.Message }
  }
}

function Get-StatusCode($url, $method = 'GET') {
  try {
    $r = Invoke-WebRequest -Uri $url -Method $method -MaximumRedirection 0 -TimeoutSec 60 -ErrorAction Stop
    return [int]$r.StatusCode
  } catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    throw
  }
}

Test-Endpoint 'API /health' {
  $r = Invoke-RestMethod -Uri "$api/health" -Method Get -TimeoutSec 60
  if ($r.status -ne 'ok' -or $r.service -ne 'colibri-api') { throw "unexpected: $($r | ConvertTo-Json -Compress)" }
}

Test-Endpoint 'API /marketplace/products (no tenantId)' {
  $r = Invoke-RestMethod -Uri "$api/marketplace/products?pageSize=1" -Method Get -TimeoutSec 60
  if ($null -eq $r.data) { throw 'missing data array' }
  $json = $r | ConvertTo-Json -Depth 10
  if ($json -match 'tenantId|siteId') { throw 'response contains tenantId or siteId' }
}

Test-Endpoint 'API /marketplace/categories' {
  $r = Invoke-RestMethod -Uri "$api/marketplace/categories" -Method Get -TimeoutSec 60
  if ($null -eq $r.data) { throw 'missing data' }
}

Test-Endpoint 'API generic quote POST' {
  $body = @{
    requesterName  = 'Wave9 Smoke'
    requesterEmail = 'wave9-smoke@colibri.local'
    message        = 'wave-9 final validation'
  } | ConvertTo-Json
  $r = Invoke-WebRequest -Uri "$api/marketplace/quotes" -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 60
  if ($r.StatusCode -notin 200, 201) { throw "status $($r.StatusCode)" }
}

Test-Endpoint 'Web /' {
  if ((Get-StatusCode "$web/") -ne 200) { throw 'expected 200' }
}

Test-Endpoint 'Web /produtos' {
  if ((Get-StatusCode "$web/produtos") -ne 200) { throw 'expected 200' }
}

Test-Endpoint 'Web /orcamento' {
  if ((Get-StatusCode "$web/orcamento") -ne 200) { throw 'expected 200' }
}

Test-Endpoint 'Web /minha-conta redirects when logged out' {
  $code = Get-StatusCode "$web/minha-conta"
  if ($code -notin 307, 302) { throw "expected 307/302, got $code" }
}

Test-Endpoint 'Web /admin redirects when logged out' {
  $code = Get-StatusCode "$web/admin"
  if ($code -notin 307, 302) { throw "expected 307/302, got $code" }
}

Test-Endpoint 'Web /marketplace/* returns 404' {
  foreach ($path in @('/marketplace', '/marketplace/produtos', '/marketplace/minha-conta')) {
    $code = Get-StatusCode "$web$path"
    if ($code -ne 404) { throw "$path expected 404, got $code" }
  }
}

Test-Endpoint 'Web /pluma removed (404)' {
  if ((Get-StatusCode "$web/pluma") -ne 404) { throw 'expected 404' }
}

$script:results | Format-Table -AutoSize
$failed = @($script:results | Where-Object { -not $_.Ok })
if ($failed.Count -gt 0) {
  Write-Host "FAILED: $($failed.Count) check(s)" -ForegroundColor Red
  exit 1
}
Write-Host "PASSED: $($script:results.Count) check(s)" -ForegroundColor Green
