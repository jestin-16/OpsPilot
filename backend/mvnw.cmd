@REM Maven Wrapper for Windows
@echo off
setlocal
set "DIR=%~dp0"
set "JAVACMD=java"
if not "%JAVA_HOME%"=="" set "JAVACMD=%JAVA_HOME%\bin\java.exe"
"%JAVACMD%" "-Dmaven.multiModuleProjectDirectory=%DIR:~0,-1%" -classpath "%DIR%.mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
if errorlevel 1 goto error
goto end
:error
exit /b 1
:end
exit /b 0
