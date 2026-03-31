#!/bin/bash
node test-auth.js > test-auth.log 2>&1
node test-api.js > test-api.log 2>&1
echo "DONE" > test_done.txt
