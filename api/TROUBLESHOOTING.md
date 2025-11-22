# Guia de Solução de Problemas - API KeyUnit

## Problema: ERR_CONNECTION_TIMED_OUT ao conectar com a API

### Sintomas
- Cliente tenta conectar com `https://api.keyunit.online:3001/api/1.3/init`
- Erro: `ERR_CONNECTION_TIMED_OUT`
- Mensagem: "api.keyunit.online demorou muito para responder"

### Causa Raiz
O servidor está configurado para rodar em **HTTP** (não HTTPS), mas os clientes estão tentando conectar usando **HTTPS**. Isso causa um timeout porque:

1. O cliente inicia um handshake SSL/TLS
2. O servidor HTTP não entende o protocolo SSL/TLS
3. A conexão não é estabelecida e resulta em timeout

### Soluções

#### Solução 1: Configurar HTTPS no Servidor (Recomendado para Produção)

1. **Obter certificados SSL:**
   - Use Let's Encrypt (gratuito): `certbot certonly --standalone -d api.keyunit.online`
   - Ou use certificados de um provedor comercial
   - Ou gere certificados auto-assinados para testes (não recomendado para produção)

2. **Configurar variáveis de ambiente no arquivo `.env`:**
```env
SSL_ENABLED=true
SSL_KEY_PATH=/caminho/para/key.pem
SSL_CERT_PATH=/caminho/para/cert.pem
```

3. **Criar diretório para certificados:**
```bash
mkdir -p api/ssl
# Copiar certificados para api/ssl/
```

4. **Reiniciar o servidor:**
```bash
cd api
npm start
```

#### Solução 2: Usar Proxy Reverso (Nginx) - Melhor para Produção

Configure um proxy reverso Nginx que faz SSL termination:

```nginx
server {
    listen 443 ssl;
    server_name api.keyunit.online;

    ssl_certificate /caminho/para/cert.pem;
    ssl_certificate_key /caminho/para/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Com essa configuração:
- Clientes se conectam via HTTPS na porta 443 (padrão)
- Nginx faz SSL termination e encaminha para o servidor HTTP na porta 3001
- Não é necessário configurar HTTPS no Node.js

#### Solução 3: Mudar Clientes para HTTP (Apenas para Desenvolvimento/Testes)

⚠️ **NÃO RECOMENDADO PARA PRODUÇÃO**

Se estiver apenas testando localmente, você pode mudar temporariamente os clientes para usar HTTP:

```lua
-- Lua
baseURL = "https://api.keyunit.online"
```

```csharp
// C#
private readonly string baseURL = "https://api.keyunit.online";
```

```cpp
// C++
std::string baseURL = "https://api.keyunit.online";
```

### Verificação

1. **Verificar se o servidor está rodando:**
```bash
curl http://localhost:3001/api/1.3/init -X POST -H "Content-Type: application/json" -d '{"type":"init","name":"test","ownerid":"test","hash":"test"}'
```

2. **Verificar se HTTPS está funcionando (se configurado):**
```bash
curl https://api.keyunit.online:3001/api/1.3/init -X POST -H "Content-Type: application/json" -d '{"type":"init","name":"test","ownerid":"test","hash":"test"}' -k
```

3. **Verificar logs do servidor:**
   - O servidor deve mostrar: `🚀 API Server rodando em https://...` se HTTPS estiver habilitado
   - Ou: `🚀 API Server rodando em http://...` se estiver usando HTTP

### Problemas Comuns

#### "SSL habilitado mas certificados não encontrados"
- Verifique se os caminhos em `SSL_KEY_PATH` e `SSL_CERT_PATH` estão corretos
- Verifique se os arquivos existem e têm permissões de leitura

#### "Erro ao iniciar servidor HTTPS"
- Verifique se os certificados são válidos
- Verifique se os certificados não expiraram
- Verifique se a porta 3001 não está sendo usada por outro processo

#### "Porta 3001 já em uso"
```bash
# Linux/Mac
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Configuração Recomendada para Produção

1. **Use Nginx como proxy reverso** (Solução 2)
2. **Configure firewall** para permitir apenas porta 443 (HTTPS)
3. **Use certificados válidos** (Let's Encrypt ou comercial)
4. **Configure auto-renovação** de certificados (certbot com cron)

### Suporte

Se o problema persistir:
1. Verifique os logs do servidor (`api/server.js` imprime logs detalhados)
2. Verifique os logs do cliente (se disponível)
3. Teste a conectividade de rede
4. Verifique configurações de firewall/proxy

