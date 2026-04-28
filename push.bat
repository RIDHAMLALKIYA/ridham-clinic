@echo off
set PATH=C:\Program Files\Git\bin;%PATH%
git config user.name "Ridham Lalakiya"
git config user.email "ridhamlalakiya@gmail.com"
git add .
git commit -m "Initial commit - Ridham Clinic App" --author="Ridham Lalakiya <ridhamlalakiya@gmail.com>"
git branch -M main
git pull origin main --allow-unrelated-histories --strategy-option=theirs
git push -u origin main
echo.
echo DONE! Check https://github.com/RIDHAMLALKIYA/ridham-clinic
pause
