# 🔐 Sistema de Autenticação - Similar KeyUnit

Sistema completo de autenticação com interface web animada e integração para C++, C# e Lua.

## ✨ Características

- 🎨 **Interface Moderna**: Tela de login/registro animada com SVG
- 🔄 **Mesma Página**: Toggle entre login e registro sem recarregar
- 🎭 **Animações**: SVG animado e transições suaves
- 🌐 **API RESTful**: Backend Node.js/Express similar ao KeyUnit
- 🔌 **Multi-plataforma**: Exemplos de integração para C++, C# e Lua
- 🔒 **Sistema de Licenças**: Validação de licenças no registro
- 🎫 **Sessões**: Gerenciamento de sessões com tokens

## 🚀 Instalação

### Frontend (React)

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Backend (API)

```bash
cd api

# Instalar dependências
npm install

# Rodar servidor
npm start

# Ou em modo desenvolvimento (com nodemon)
npm run dev
```

## 📁 Estrutura do Projeto

```
auth/
├── src/
│   ├── components/
│   │   ├── AuthPage.jsx      # Componente principal de autenticação
│   │   └── AuthPage.css      # Estilos e animações
│   ├── services/
│   │   └── api.js            # Serviço de comunicação com API
│   ├── App.jsx
│   └── main.jsx
├── api/
│   ├── server.js             # Servidor Express
│   └── package.json
├── integrations/
│   ├── cpp_example.cpp       # Exemplo C++
│   ├── csharp_example.cs     # Exemplo C#
│   └── lua_example.lua       # Exemplo Lua
└── package.json
```

## 🎯 Uso

### Web Interface

1. Acesse `http://keyunit.online:3000`
2. Use o botão "Registre-se" ou "Faça Login" para alternar entre modos
3. Preencha os campos e envie

**Licenças de Teste:**
- `TEST-LICENSE-001` (Premium - 365 dias)
- `TEST-LICENSE-002` (Standard - 90 dias)
- `TEST-LICENSE-003` (Premium - 180 dias)

### API Endpoints

#### POST `/api/login`
```json
{
  "username": "usuario",
  "password": "senha123"
}
```

#### POST `/api/register`
```json
{
  "username": "usuario",
  "password": "senha123",
  "email": "usuario@email.com",
  "license": "TEST-LICENSE-001"
}
```

#### POST `/api/verify`
```json
{
  "sessionid": "token_de_sessao"
}
```

#### POST `/api/logout`
```json
{
  "sessionid": "token_de_sessao"
}
```

## 🔌 Integração com C++, C# e Lua

### C++

```cpp
AuthAPI auth;
if (auth.login("usuario", "senha123")) {
    auth.verify();
    auth.logout();
}
```

**Dependências:**
- libcurl
- jsoncpp

### C#

```csharp
var auth = new AuthAPI();
if (await auth.LoginAsync("usuario", "senha123")) {
    await auth.VerifyAsync();
    await auth.LogoutAsync();
}
```

**Dependências:**
- System.Net.Http
- System.Text.Json

### Lua

```lua
local auth = AuthAPI:new()
if auth:login("usuario", "senha123") then
    auth:verify()
    auth:logout()
end
```

**Dependências:**
- luasocket (http)
- lua-cjson ou json

## 🎨 Recursos Visuais

- **Animações SVG**: Formas flutuantes no fundo
- **Logo Animado**: SVG com animação de desenho
- **Transições Suaves**: Animações CSS para todas as interações
- **Design Responsivo**: Funciona em desktop e mobile
- **Feedback Visual**: Mensagens de sucesso/erro animadas

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=https://api.keyunit.online:3001
```

### Portas

- Frontend: `3000`
- Backend: `3001`

Altere em `vite.config.js` e `api/server.js` se necessário.

## 📝 Notas

- O sistema usa armazenamento em memória (não persiste dados)
- Para produção, integre com banco de dados (MongoDB, PostgreSQL, etc.)
- Adicione HTTPS para segurança em produção
- Implemente rate limiting para prevenir abuso
- Use JWT ou similar para tokens mais seguros

## 🛠️ Tecnologias

- **Frontend**: React, Vite, CSS3
- **Backend**: Node.js, Express
- **HTTP Client**: Axios
- **Animações**: CSS Animations, SVG

## 📄 Licença

Este projeto é um exemplo educacional.

