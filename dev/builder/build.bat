@echo off
setlocal enabledelayedexpansion

echo CKBuilder - Builds a release version of ckeditor-dev.
echo.

set CKBUILDER_VERSION=2.3.1
set VERSION=4.7.1 DEV

REM 1. 进入bat文件所在目录
cd /d "%~dp0"

REM 获取git revision
for /f "tokens=*" %%i in ('git rev-parse --verify --short HEAD 2^>nul') do set REVISION=%%i
if "%REVISION%"=="" set REVISION=unknown

REM 获取git tag作为版本号（如果存在）
for /f "tokens=*" %%i in ('git symbolic-ref -q --short HEAD 2^>nul') do set TAG=%%i
if "%TAG%"=="" (
    for /f "tokens=*" %%i in ('git describe --tags --exact-match 2^>nul') do set TAG=%%i
)
if not "%TAG%"=="" (
    echo Setting version to %TAG%
    set VERSION=%TAG%
)

echo Starting CKBuilder...
echo.

REM 2. 执行CKBuilder命令
java -jar ckbuilder/%CKBUILDER_VERSION%/ckbuilder.jar --build ../../ release %* --version="%VERSION%" --revision="%REVISION%" --overwrite

if errorlevel 1 (
    echo Error: CKBuilder failed
    exit /b 1
)

REM 3. Copy and build tests
echo.
echo Copying tests...

if exist "../../tests" (
    xcopy /E /I /Y "../../tests" "release\ckeditor\tests"
)
if exist "../../package.json" (
    copy /Y "../../package.json" "release\ckeditor\package.json"
)
if exist "../../bender.js" (
    copy /Y "../../bender.js" "release\ckeditor\bender.js"
)

echo.
echo Installing tests...
cd release\ckeditor
if exist "package.json" (
    call npm install
    call bender init
)
cd ..\..\

REM 4. 拷贝../../wrapper/hmgrowl
echo.
echo Starting copy hm code...
if exist "../../wrapper/hmgrowl" (
    xcopy /E /I /Y "../../wrapper/hmgrowl" "release\ckeditor\wrapper\hmgrowl"
) else (
    echo Warning: ../../wrapper/hmgrowl not found
)

echo.
echo Release created in the "release" directory.

echo.
echo Executing post-build commands...

cd ..\..\
call cnpm install
if errorlevel 1 (
    echo Warning: cnmp install failed, trying npm install
    call npm install
)

call grunt release
if errorlevel 1 (
    echo Error: grunt release failed
    exit /b 1
)

cd dev\builder\release\ckeditor

call cnmp install --production
if errorlevel 1 (
    echo Warning: cnmp install --production failed, trying npm install --production
    call npm install --production
)

echo.
echo Build completed successfully!
pause