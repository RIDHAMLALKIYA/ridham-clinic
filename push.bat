@echo off
set PATH=C:\Program Files\Git\bin;%PATH%
git config user.name "Ridham Lalakiya"
git config user.email "ridhamlalakiya@gmail.com"
git rm --cached sqlite.db 2>nul
git add .
git commit -m "Update - Ridham Clinic App" --author="Ridham Lalakiya <ridhamlalakiya@gmail.com>"
git pull origin main --allow-unrelated-histories --strategy-option=theirs
git push -u origin main
echo.
echo Pushing to Vercel...
vercel --prod --yes
echo.
echo DONE! Website updated at https://ridham-clinic-v1.vercel.app
pause
