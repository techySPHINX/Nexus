#!/bin/bash

# Performance Testing Script for Nexus Backend
# Runs k6 load tests and generates reports

set -e

echo "=== Nexus Performance Testing ==="
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "k6 not found. Installing..."
    
    # Detect OS and install k6
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install k6
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    else
        echo "Unsupported OS. Please install k6 manually from: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
fi

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_DIR="load-tests"
RESULTS_DIR="load-tests/results"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "Base URL: $BASE_URL"
echo "Results Directory: $RESULTS_DIR"
echo ""

# Function to run test
run_k6_test() {
    local test_name=$1
    local test_file=$2
    local description=$3
    
    echo "Running $test_name..."
    echo "Description: $description"
    echo ""
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local result_file="$RESULTS_DIR/$test_name-$timestamp.json"
    local html_file="$RESULTS_DIR/$test_name-$timestamp.html"
    
    # Run k6 test
    k6 run \
        --out json="$result_file" \
        -e BASE_URL="$BASE_URL" \
        "$TEST_DIR/$test_file"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✓ $test_name completed successfully"
    else
        echo "✗ $test_name failed with exit code: $exit_code"
    fi
    
    echo "Results saved to: $result_file"
    echo ""
    
    return $exit_code
}

# Menu
echo "Select test to run:"
echo "1. Load Test (Standard load with ramp-up)"
echo "2. Spike Test (Sudden traffic surge)"
echo "3. Soak Test (Extended 30-minute test for memory leaks)"
echo "4. All Tests (Run all tests sequentially)"
echo "5. Exit"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        run_k6_test \
            "load-test" \
            "k6-load-test.js" \
            "Standard load test with gradual ramp-up to 200 concurrent users"
        ;;
    2)
        run_k6_test \
            "spike-test" \
            "k6-spike-test.js" \
            "Spike test with sudden surge to 500 concurrent users"
        ;;
    3)
        run_k6_test \
            "soak-test" \
            "k6-soak-test.js" \
            "Soak test running 50 users for 30 minutes to detect memory leaks"
        ;;
    4)
        echo "Running all tests..."
        echo ""
        
        results=()
        
        run_k6_test \
            "load-test" \
            "k6-load-test.js" \
            "Standard load test"
        results+=($?)
        
        echo "Cool-down period (30 seconds)..."
        sleep 30
        
        run_k6_test \
            "spike-test" \
            "k6-spike-test.js" \
            "Spike test"
        results+=($?)
        
        echo "Cool-down period (30 seconds)..."
        sleep 30
        
        echo ""
        echo "=== Test Summary ==="
        if [[ ! " ${results[@]} " =~ " 1 " ]]; then
            echo "✓ All tests passed"
        else
            echo "✗ Some tests failed"
        fi
        
        echo ""
        echo "Note: Soak test (30 minutes) not run in 'all tests' mode."
        echo "Run it separately if needed to detect memory leaks."
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Performance testing completed!"
echo "Results are available in: $RESULTS_DIR"
echo ""

# Analyze results
echo "Quick Analysis:"
latest_result=$(ls -t "$RESULTS_DIR"/*.json 2>/dev/null | head -1)
if [ -n "$latest_result" ]; then
    echo "Latest result file: $(basename "$latest_result")"
    echo "Size: $(du -h "$latest_result" | cut -f1)"
fi

echo ""
echo "For detailed analysis, use k6 Cloud or import JSON results into Grafana"
