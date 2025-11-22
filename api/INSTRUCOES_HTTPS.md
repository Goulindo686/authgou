# 🚀 Instruções Rápidas - Configurar HTTPS

## Status Atual
✅ Diretório `ssl` criado  
✅ Configurações SSL adicionadas ao `.env`  
✅ Certificado criado no repositório do Windows (Thumbprint: 3838C2730AD3CCC90EBA9A9B766D4BD5AF2CBAE5)

## ⚡ Solução Rápida - 3 Opções

### Opção 1: Usar OpenSSL (Mais Rápido)

**Se você tem Git instalado:**
1. Abra **Git Bash**
2. Execute:
```bash
cd /c/Users/Administrator/Desktop/auth/api/ssl
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=api.keyunit.online"
```

### Opção 2: Instalar OpenSSL no Windows

1. **Baixe OpenSSL:**
   - Acesse: https://slproweb.com/products/Win32OpenSSL.html
   - Baixe: "Win64 OpenSSL" (versão Light)
   - Instale (deixe marcado "Copy OpenSSL DLLs to")

2. **Abra PowerShell como Administrador:**
```powershell
cd C:\Users\Administrator\Desktop\auth\api\ssl
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=api.keyunit.online"
```

### Opção 3: Converter Certificado Existente (Já criado)

O certificado já foi criado no Windows. Para exportá-lo:

1. **Exportar como PFX:**
```powershell
cd C:\Users\Administrator\Desktop\auth\api
$cert = Get-ChildItem Cert:\CurrentUser\My\3838C2730AD3CCC90EBA9A9B766D4BD5AF2CBAE5
$password = ConvertTo-SecureString -String "temp123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "ssl\cert.pfx" -Password $password
```

2. **Converter PFX para PEM (precisa OpenSSL):**
```bash
cd ssl
openssl pkcs12 -in cert.pfx -nocerts -nodes -out key.pem -passin pass:temp123
openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.pem -passin pass:temp123
```

## ✅ Após Criar os Certificados

1. **Verificar se os arquivos existem:**
```powershell
Get-ChildItem api\ssl\*.pem
```

2. **Ativar HTTPS no `.env`:**
Edite `api\.env` e mude:
```env
SSL_ENABLED=true
```

3. **Reiniciar o servidor:**
```powershell
cd api
npm start
```

Você deve ver:
```
✅ Servidor HTTPS iniciado com certificados SSL
🚀 API Server rodando em https://0.0.0.0:3001
```

## 🧪 Testar HTTPS

```powershell
$json = '{"type":"init","name":"test","ownerid":"test","hash":"test"}'
try {
    $response = Invoke-RestMethod -Uri 'https://localhost:3001/api/1.3/init' -Method POST -ContentType 'application/json' -Body $json -SkipCertificateCheck
    Write-Host "✅ HTTPS funcionando!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}
```

## 📝 Notas Importantes

- ⚠️ Certificados auto-assinados mostram avisos de segurança nos clientes
- ✅ Para produção, use Let's Encrypt (gratuito) ou certificados comerciais
- 🔒 Com HTTPS configurado, os clientes poderão conectar com `https://api.keyunit.online:3001`

## 🆘 Precisa de Ajuda?

Consulte:
- `api/SETUP_HTTPS.md` - Guia completo
- `api/TROUBLESHOOTING.md` - Solução de problemas

