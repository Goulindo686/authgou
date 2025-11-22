# Script para gerar certificados SSL auto-assinados para testes
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

# Verificar se OpenSSL está disponível
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if (-not $openssl) {
    Write-Host "❌ OpenSSL não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "1. Instalar OpenSSL:" -ForegroundColor Cyan
    Write-Host "   - Via Chocolatey: choco install openssl" -ForegroundColor Gray
    Write-Host "   - Via Git Bash (já vem instalado)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Usar Git Bash para gerar certificados:" -ForegroundColor Cyan
    Write-Host "   cd api/ssl" -ForegroundColor Gray
    Write-Host "   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=api.keyunit.online'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Usar Let's Encrypt (recomendado para produção):" -ForegroundColor Cyan
    Write-Host "   certbot certonly --standalone -d api.keyunit.online" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "📝 Gerando chave privada e certificado..." -ForegroundColor Cyan

# Gerar certificado auto-assinado válido por 365 dias
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
        Write-Host ""
        Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Configure o arquivo .env com:" -ForegroundColor Cyan
        Write-Host "   SSL_ENABLED=true" -ForegroundColor Gray
        Write-Host "   SSL_KEY_PATH=./ssl/key.pem" -ForegroundColor Gray
        Write-Host "   SSL_CERT_PATH=./ssl/cert.pem" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Reinicie o servidor" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao gerar certificados" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao executar OpenSSL: $_" -ForegroundColor Red
    exit 1
}

