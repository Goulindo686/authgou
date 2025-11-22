# Guia de Configuração HTTPS - Passo a Passo

## Opção 1: Gerar Certificados Auto-Assinados (Para Testes)

### No Windows com Git Bash (Recomendado)

1. **Abra o Git Bash** (se tiver Git instalado)

2. **Navegue até a pasta api:**
```bash
cd /c/Users/Administrator/Desktop/auth/api
```

3. **Execute o script:**
```bash
bash generate-ssl-cert.sh
```

**OU gere manualmente:**
```bash
cd ssl
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=api.keyunit.online"
```

### No Windows com PowerShell

1. **Abra o PowerShell como Administrador**

2. **Navegue até a pasta api:**
```powershell
cd C:\Users\Administrator\Desktop\auth\api
```

3. **Execute o script:**
```powershell
.\generate-ssl-cert-windows.ps1
```

### Instalar OpenSSL no Windows

Se não tiver OpenSSL:

1. **Via Chocolatey:**
```powershell
choco install openssl
```

2. **Ou baixar manualmente:**
   - Acesse: https://slproweb.com/products/Win32OpenSSL.html
   - Baixe a versão "Win64 OpenSSL"
   - Instale e adicione ao PATH

## Opção 2: Usar Let's Encrypt (Recomendado para Produção)

### No Linux/Ubuntu:

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot

# Gerar certificados
sudo certbot certonly --standalone -d api.keyunit.online

# Os certificados estarão em:
# /etc/letsencrypt/live/api.keyunit.online/fullchain.pem
# /etc/letsencrypt/live/api.keyunit.online/privkey.pem
```

Depois, configure no `.env`:
```env
SSL_ENABLED=true
SSL_KEY_PATH=/etc/letsencrypt/live/api.keyunit.online/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/api.keyunit.online/fullchain.pem
```

## Passo 2: Configurar o arquivo .env

Edite o arquivo `api/.env` e configure:

```env
SSL_ENABLED=true
SSL_KEY_PATH=./ssl/key.pem
SSL_CERT_PATH=./ssl/cert.pem
```

## Passo 3: Reiniciar o Servidor

```bash
cd api
npm start
```

Você deve ver:
```
✅ Servidor HTTPS iniciado com certificados SSL
🚀 API Server rodando em https://0.0.0.0:3001
```

## Passo 4: Testar

```powershell
# No PowerShell
$json = '{"type":"init","name":"test","ownerid":"test","hash":"test"}'
try {
    $response = Invoke-RestMethod -Uri 'https://localhost:3001/api/1.3/init' -Method POST -ContentType 'application/json' -Body $json -SkipCertificateCheck
    $response | ConvertTo-Json
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
}
```

**Nota:** O parâmetro `-SkipCertificateCheck` é necessário para certificados auto-assinados.

## Solução de Problemas

### "SSL habilitado mas certificados não encontrados"
- Verifique se os arquivos `key.pem` e `cert.pem` existem em `api/ssl/`
- Verifique se os caminhos no `.env` estão corretos

### "Erro ao iniciar servidor HTTPS"
- Verifique se os certificados são válidos
- Verifique se a porta 3001 não está em uso
- Verifique os logs do servidor para mais detalhes

### Clientes mostram aviso de certificado inválido
- Isso é normal com certificados auto-assinados
- Para produção, use certificados válidos (Let's Encrypt)

