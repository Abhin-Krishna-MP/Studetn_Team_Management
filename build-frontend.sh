#!/bin/bash
cd frontend
npm install > npm_install.log 2>&1
npm run build > npm_build.log 2>&1
echo "DONE" > build_done.txt
