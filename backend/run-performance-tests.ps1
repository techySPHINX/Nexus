#!/usr/bin/env powershell

# Performance Testing Script for Nexus Backend
# Runs k6 load tests and generates reports

Write-Host "=== Nexus Performance Testing ===" -ForegroundColor Cyan
Write-Host ""

# Check if k6 is installed
$k6Installed = Get-Command k6 -ErrorAction SilentlyContinue
if (-not $k6Installed) {
    Write-Host "k6 not found. Installing..." -ForegroundColor Yellow
    
    # Install k6 using winget
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install k6 --silent
    } else {
        Write-Host "Please install k6 manually from: https://k6.io/docs/getting-started/installation/" -ForegroundColor Red
        exit 1
    }
}

# Configuration
$BASE_URL = $env:BASE_URL
if (-not $BASE_URL) {
    $BASE_URL = "http://localhost:3000"
}

$TEST_DIR = "load-tests"
$RESULTS_DIR = "load-tests/results"

# Create results directory
New-Item -ItemType Directory -Force -Path $RESULTS_DIR | Out-Null

Write-Host "Base URL: $BASE_URL" -ForegroundColor Green
Write-Host "Results Directory: $RESULTS_DIR" -ForegroundColor Green
Write-Host ""

# Function to run test
function Run-K6Test {
    param(
        [string]$TestName,
        [string]$TestFile,
        [string]$Description
    )
    
    Write-Host "Running $TestName..." -ForegroundColor Cyan
    Write-Host "Description: $Description" -ForegroundColor Gray
    Write-Host ""
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $resultFile = "$RESULTS_DIR/$TestName-$timestamp.json"
    $htmlFile = "$RESULTS_DIR/$TestName-$timestamp.html"
    
    # Run k6 test
    k6 run `
        --out json=$resultFile `
        -e BASE_URL=$BASE_URL `
        "$TEST_DIR/$TestFile"
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✓ $TestName completed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ $TestName failed with exit code: $exitCode" -ForegroundColor Red
    }
    
    Write-Host "Results saved to: $resultFile" -ForegroundColor Gray
    Write-Host ""
    
    return $exitCode
}

# Menu
Write-Host "Select test to run:" -ForegroundColor Yellow
Write-Host "1. Load Test (Standard load with ramp-up)" -ForegroundColor White
Write-Host "2. Spike Test (Sudden traffic surge)" -ForegroundColor White
Write-Host "3. Soak Test (Extended 30-minute test for memory leaks)" -ForegroundColor White
Write-Host "4. All Tests (Run all tests sequentially)" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Run-K6Test `
            -TestName "load-test" `
            -TestFile "k6-load-test.js" `
            -Description "Standard load test with gradual ramp-up to 200 concurrent users"
    }
    "2" {
        Run-K6Test `
            -TestName "spike-test" `
            -TestFile "k6-spike-test.js" `
            -Description "Spike test with sudden surge to 500 concurrent users"
    }
    "3" {
        Run-K6Test `
            -TestName "soak-test" `
            -TestFile "k6-soak-test.js" `
            -Description "Soak test running 50 users for 30 minutes to detect memory leaks"
    }
    "4" {
        Write-Host "Running all tests..." -ForegroundColor Cyan
        Write-Host ""
        
        $results = @()
        
        $results += Run-K6Test `
            -TestName "load-test" `
            -TestFile "k6-load-test.js" `
            -Description "Standard load test"
        
        Start-Sleep -Seconds 30  # Cool-down period
        
        $results += Run-K6Test `
            -TestName "spike-test" `
            -TestFile "k6-spike-test.js" `
            -Description "Spike test"
        
        Start-Sleep -Seconds 30  # Cool-down period
        
        Write-Host ""
        Write-Host "=== Test Summary ===" -ForegroundColor Cyan
        if ($results -contains 0) {
            Write-Host "✓ All tests passed" -ForegroundColor Green
        } else {
            Write-Host "✗ Some tests failed" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Note: Soak test (30 minutes) not run in 'all tests' mode." -ForegroundColor Yellow
        Write-Host "Run it separately if needed to detect memory leaks." -ForegroundColor Yellow
    }
    "5" {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Performance testing completed!" -ForegroundColor Green
Write-Host "Results are available in: $RESULTS_DIR" -ForegroundColor Gray
Write-Host ""

# Analyze results
Write-Host "Quick Analysis:" -ForegroundColor Cyan
$latestResult = Get-ChildItem -Path $RESULTS_DIR -Filter "*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestResult) {
    Write-Host "Latest result file: $($latestResult.Name)" -ForegroundColor Gray
    Write-Host "Size: $([math]::Round($latestResult.Length / 1KB, 2)) KB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "For detailed analysis, use k6 Cloud or import JSON results into Grafana" -ForegroundColor Yellow
