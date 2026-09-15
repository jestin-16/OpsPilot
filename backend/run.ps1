Set-Location -Path "d:\OpsPilot\backend"
$env:MAVEN_OPTS="-Xmx128m -Djava.net.preferIPv4Stack=true -Dspring-boot.run.jvmArguments=-Djava.net.preferIPv4Stack=true"

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

Write-Host "Starting API Gateway..."
Start-Process -NoNewWindow -FilePath "java" -ArgumentList "-jar", ".mvn\wrapper\maven-wrapper.jar", "spring-boot:run", "-pl", "api-gateway"

Write-Host "All services started!"
