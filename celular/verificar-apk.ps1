# Script para verificar se o APK foi gerado

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "`n🔍 Verificando APK..." -ForegroundColor Cyan

if (Test-Path $apkPath) {
    $file = Get-Item $apkPath
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    
    Write-Host "`n✅ APK GERADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "`n📱 Informações do APK:" -ForegroundColor Cyan
    Write-Host "   Localização: $($file.FullName)" -ForegroundColor White
    Write-Host "   Tamanho: $sizeMB MB" -ForegroundColor White
    Write-Host "   Data: $($file.LastWriteTime)" -ForegroundColor White
    Write-Host "`n📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Transfira o APK para seu dispositivo Android" -ForegroundColor White
    Write-Host "   2. No dispositivo, ative 'Instalar apps desconhecidos'" -ForegroundColor White
    Write-Host "   3. Abra o arquivo .apk e instale" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`n⏳ APK ainda não foi gerado." -ForegroundColor Yellow
    Write-Host "   O build ainda está em andamento..." -ForegroundColor White
    Write-Host "   Execute este script novamente em alguns instantes." -ForegroundColor White
    Write-Host ""
}
