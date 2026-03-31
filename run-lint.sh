#!/bin/bash
cd frontend
npx eslint src/ > lint.log 2>&1
echo "DONE" > lint_done.txt
