Set-Location -Path "d:\OpsPilot\backend"
$env:MAVEN_OPTS="-Xmx128m -Djava.net.preferIPv4Stack=true -Dspring-boot.run.jvmArguments=-Djava.net.preferIPv4Stack=true"

# Load ..\.env (JWT_SECRET is required by every service), like run-microservices.sh does.
if (Test-Path "..\.env") {
    Get-Content "..\.env" | Where-Object { $_ -match '^\s*[^#\s][^=]*=' } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
    }
}

function Run-Mvn {
    param([string[]]$Args)
    & java -jar .mvn\wrapper\maven-wrapper.jar $Args
}

Write-Host "Installing parent POM..."
Run-Mvn "clean", "install", "-N"

Write-Host "Building shared-lib..."
Run-Mvn "clean", "install", "-pl", "shared-lib"

Write-Host "Starting Service Registry..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "service-registry"
Start-Sleep -Seconds 15

Write-Host "Starting Auth Service..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "auth-service"

Write-Host "Starting Core Service..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "core-service"

Write-Host "Starting Observability Service..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "observability-service"

Write-Host "Starting Log Watcher Service..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "log-watcher-service"

Write-Host "Starting API Gateway..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "api-gateway"

Write-Host "All services started!"
