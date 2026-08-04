@echo off

cd /d C:\Projects\sixnations-predictor

git status > commit-review.txt

echo. >> commit-review.txt
echo ========================================== >> commit-review.txt
echo MODIFIED FILES >> commit-review.txt
echo ========================================== >> commit-review.txt

git diff --name-only >> commit-review.txt

echo. >> commit-review.txt
echo ========================================== >> commit-review.txt
echo FULL DIFF >> commit-review.txt
echo ========================================== >> commit-review.txt

git diff >> commit-review.txt

echo.
echo Review file created:
echo.
echo C:\Projects\sixnations-predictor\commit-review.txt
echo.

pause