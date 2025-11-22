# Script para exportar certificado do Windows para formato PEM
# Execute este script APÓS criar o certificado com generate-ssl-cert-windows.ps1

param(
    [string]$Thumbprint = "3838C2730AD3CCC90EBA9A9B766D4BD5AF2CBAE5"
)

$sslDir = Join-Path $PSScriptRoot "ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
}

$keyPath = Join-Path $sslDir "key.pem"
$certPath = Join-Path $sslDir "cert.pem"
$pfxPath = Join-Path $sslDir "cert.pfx"
$tempPassword = "temp-password-123"

Write-Host "📤 Exportando certificado do Windows..." -ForegroundColor Cyan

try {
    # Obter certificado do repositório
    $cert = Get-ChildItem -Path "Cert:\CurrentUser\My\$Thumbprint" -ErrorAction Stop
    
    Write-Host "✅ Certificado encontrado: $($cert.Subject)" -ForegroundColor Green
    
    # Exportar como PFX
    $password = ConvertTo-SecureString -String $tempPassword -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
    
    Write-Host "✅ Certificado exportado como PFX" -ForegroundColor Green
    
    # Tentar converter para PEM usando OpenSSL
    $openssl = Get-Command openssl -ErrorAction SilentlyContinue
    
    if ($openssl) {
        Write-Host "🔄 Convertendo PFX para PEM usando OpenSSL..." -ForegroundColor Cyan
        
        # Extrair chave privada
        & openssl pkcs12 -in $pfxPath -nocerts -nodes -out $keyPath -passin pass:$tempPassword 2>&1 | Out-Null
        
        # Extrair certificado
        & openssl pkcs12 -in $pfxPath -clcerts -nokeys -out $certPath -passin pass:$tempPassword 2>&1 | Out-Null
        
        # Remover PFX temporário
        Remove-Item $pfxPath -Force
        
        if (Test-Path $keyPath -and Test-Path $certPath) {
            Write-Host ""
            Write-Host "✅ Certificados PEM gerados com sucesso!" -ForegroundColor Green
            Write-Host "   Key: $keyPath" -ForegroundColor Gray
            Write-Host "   Cert: $certPath" -ForegroundColor Gray
            Write-Host ""
            Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
            Write-Host "1. Configure o arquivo .env com:" -ForegroundColor Cyan
            Write-Host "   SSL_ENABLED=true" -ForegroundColor Gray
            Write-Host ""
            Write-Host "2. Reinicie o servidor" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Erro ao converter PFX para PEM" -ForegroundColor Yellow
            Write-Host "   PFX disponível em: $pfxPath" -ForegroundColor Gray
            Write-Host "   Senha: $tempPassword" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  OpenSSL não encontrado!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Opções:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Instalar OpenSSL e executar:" -ForegroundColor Cyan
        Write-Host "   cd ssl" -ForegroundColor Gray
        Write-Host "   openssl pkcs12 -in cert.pfx -nocerts -nodes -out key.pem -passin pass:$tempPassword" -ForegroundColor Gray
        Write-Host "   openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.pem -passin pass:$tempPassword" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Ou usar uma ferramenta online:" -ForegroundColor Cyan
        Write-Host "   https://www.sslshopper.com/ssl-converter.html" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Ou instalar Git Bash (já vem com OpenSSL):" -ForegroundColor Cyan
        Write-Host "   https://git-scm.com/downloads" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📁 Certificado PFX criado em: $pfxPath" -ForegroundColor Gray
        Write-Host "   Senha: $tempPassword" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dica: Liste os certificados disponíveis:" -ForegroundColor Yellow
    Write-Host "   Get-ChildItem Cert:\CurrentUser\My | Select-Object Thumbprint, Subject, FriendlyName" -ForegroundColor Gray
}

