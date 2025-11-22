#!/bin/bash
# Script para gerar certificados SSL auto-assinados para testes
# ⚠️ ATENÇÃO: Certificados auto-assinados são apenas para testes!
# Para produção, use certificados válidos (Let's Encrypt ou comercial)

echo "🔐 Gerando certificados SSL auto-assinados para testes..."
echo "⚠️  ATENÇÃO: Estes certificados são apenas para testes!"
echo "⚠️  Clientes podem mostrar avisos de segurança!"
echo ""

SSL_DIR="$(dirname "$0")/ssl"
mkdir -p "$SSL_DIR"

KEY_PATH="$SSL_DIR/key.pem"
CERT_PATH="$SSL_DIR/cert.pem"

# Verificar se OpenSSL está disponível
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL não encontrado!"
    echo ""
    echo "Instale OpenSSL:"
    echo "  - Ubuntu/Debian: sudo apt-get install openssl"
    echo "  - CentOS/RHEL: sudo yum install openssl"
    echo "  - macOS: brew install openssl"
    exit 1
fi

echo "📝 Gerando chave privada e certificado..."

# Gerar certificado auto-assinado válido por 365 dias
openssl req -x509 -newkey rsa:4096 \
    -keyout "$KEY_PATH" \
    -out "$CERT_PATH" \
    -days 365 \
    -nodes \
    -subj "/CN=api.keyunit.online/O=KeyUnit/C=BR"

if [ -f "$KEY_PATH" ] && [ -f "$CERT_PATH" ]; then
    echo ""
    echo "✅ Certificados gerados com sucesso!"
    echo "   Key: $KEY_PATH"
    echo "   Cert: $CERT_PATH"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure o arquivo .env com:"
    echo "   SSL_ENABLED=true"
    echo "   SSL_KEY_PATH=./ssl/key.pem"
    echo "   SSL_CERT_PATH=./ssl/cert.pem"
    echo ""
    echo "2. Reinicie o servidor"
else
    echo "❌ Erro ao gerar certificados"
    exit 1
fi

