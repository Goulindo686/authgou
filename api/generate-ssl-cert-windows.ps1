# Script para gerar certificados SSL auto-assinados no Windows usando PowerShell
# ⚠️ ATENÇÃO: Certificados auto-assinados são apenas para testes!
# Para produção, use certificados válidos (Let's Encrypt ou comercial)

Write-Host "🔐 Gerando certificados SSL auto-assinados para testes..." -ForegroundColor Yellow
Write-Host "⚠️  ATENÇÃO: Estes certificados são apenas para testes!" -ForegroundColor Red
Write-Host "⚠️  Clientes podem mostrar avisos de segurança!" -ForegroundColor Red
Write-Host ""

$sslDir = Join-Path $PSScriptRoot "ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
}

$keyPath = Join-Path $sslDir "key.pem"
$certPath = Join-Path $sslDir "cert.pem"
$pfxPath = Join-Path $sslDir "cert.pfx"

# Método 1: Tentar usar OpenSSL (se disponível via Git Bash ou instalado)
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if ($openssl) {
    Write-Host "✅ OpenSSL encontrado, usando para gerar certificados..." -ForegroundColor Green
    Write-Host "📝 Gerando chave privada e certificado..." -ForegroundColor Cyan
    
    $opensslArgs = @(
        "req",
        "-x509",
        "-newkey", "rsa:4096",
        "-keyout", $keyPath,
        "-out", $certPath,
        "-days", "365",
        "-nodes",
        "-subj", "/CN=api.keyunit.online/O=KeyUnit/C=BR"
    )
    
    try {
        & openssl $opensslArgs
        
        if (Test-Path $keyPath -and Test-Path $certPath) {
            Write-Host ""
            Write-Host "✅ Certificados gerados com sucesso!" -ForegroundColor Green
            Write-Host "   Key: $keyPath" -ForegroundColor Gray
            Write-Host "   Cert: $certPath" -ForegroundColor Gray
            exit 0
        }
    } catch {
        Write-Host "⚠️  Erro ao usar OpenSSL: $_" -ForegroundColor Yellow
    }
}

# Método 2: Usar New-SelfSignedCertificate do PowerShell (Windows)
Write-Host "📝 Usando PowerShell para gerar certificado auto-assinado..." -ForegroundColor Cyan

try {
    # Criar certificado auto-assinado
    $cert = New-SelfSignedCertificate `
        -DnsName "api.keyunit.online", "localhost" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyAlgorithm RSA `
        -KeyLength 4096 `
        -NotAfter (Get-Date).AddYears(1) `
        -FriendlyName "KeyUnit API SSL Certificate"
    
    $thumbprint = $cert.Thumbprint
    
    Write-Host "✅ Certificado criado no repositório do Windows" -ForegroundColor Green
    Write-Host "   Thumbprint: $thumbprint" -ForegroundColor Gray
    
    # Exportar certificado e chave privada
    Write-Host "📤 Exportando certificado e chave privada..." -ForegroundColor Cyan
    
    # Exportar como PFX primeiro
    $password = ConvertTo-SecureString -String "temp-password-123" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
    
    # Converter PFX para PEM usando OpenSSL (se disponível) ou instruções manuais
    if ($openssl) {
        Write-Host "🔄 Convertendo PFX para PEM usando OpenSSL..." -ForegroundColor Cyan
        & openssl pkcs12 -in $pfxPath -nocerts -nodes -out $keyPath -passin pass:temp-password-123
        & openssl pkcs12 -in $pfxPath -clcerts -nokeys -out $certPath -passin pass:temp-password-123
        
        Remove-Item $pfxPath -Force
        
        if (Test-Path $keyPath -and Test-Path $certPath) {
            Write-Host ""
            Write-Host "✅ Certificados gerados com sucesso!" -ForegroundColor Green
            Write-Host "   Key: $keyPath" -ForegroundColor Gray
            Write-Host "   Cert: $certPath" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  OpenSSL não encontrado para converter PFX para PEM" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Opções:" -ForegroundColor Yellow
        Write-Host "1. Instalar OpenSSL e executar:" -ForegroundColor Cyan
        Write-Host "   cd api/ssl" -ForegroundColor Gray
        Write-Host "   openssl pkcs12 -in cert.pfx -nocerts -nodes -out key.pem -passin pass:temp-password-123" -ForegroundColor Gray
        Write-Host "   openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.pem -passin pass:temp-password-123" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Ou usar Git Bash (já vem com OpenSSL):" -ForegroundColor Cyan
        Write-Host "   cd api/ssl" -ForegroundColor Gray
        Write-Host "   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=api.keyunit.online'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Ou baixar OpenSSL para Windows:" -ForegroundColor Cyan
        Write-Host "   https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📁 Certificado PFX criado em: $pfxPath" -ForegroundColor Gray
        Write-Host "   Senha: temp-password-123" -ForegroundColor Gray
    }
    
    # Remover certificado do repositório (opcional)
    # Remove-Item "Cert:\CurrentUser\My\$thumbprint" -Force
    
} catch {
    Write-Host "❌ Erro ao gerar certificado: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Alternativa: Use Git Bash (já vem com OpenSSL)" -ForegroundColor Yellow
    Write-Host "   cd api/ssl" -ForegroundColor Gray
    Write-Host "   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=api.keyunit.online'" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure o arquivo .env com:" -ForegroundColor Cyan
Write-Host "   SSL_ENABLED=true" -ForegroundColor Gray
Write-Host "   SSL_KEY_PATH=./ssl/key.pem" -ForegroundColor Gray
Write-Host "   SSL_CERT_PATH=./ssl/cert.pem" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Reinicie o servidor" -ForegroundColor Cyan

