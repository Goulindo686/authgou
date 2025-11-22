# API de Autenticação - Backend

Sistema de autenticação com banco de dados MySQL e envio de emails.

## Instalação

```bash
npm install
```

## Configuração

### 1. Configurar Banco de Dados MySQL

Certifique-se de ter o MySQL instalado e rodando. Crie um arquivo `.env` na pasta `api/` com as seguintes variáveis:

```env
# Configurações do Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua-senha-mysql
DB_NAME=auth_db

# Configurações de Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
```

**Importante:** O banco de dados será criado automaticamente na primeira execução usando o arquivo `schema.sql`.

### 2. Configurar Email

**Para Gmail:**
1. Ative a verificação em duas etapas na sua conta Google
2. Acesse: https://myaccount.google.com/apppasswords
3. Gere uma "Senha de App"
4. Use essa senha no campo `EMAIL_PASS`

**Para outros provedores:**
- Outlook/Hotmail: `smtp-mail.outlook.com`, porta 587
- Yahoo: `smtp.mail.yahoo.com`, porta 587
- Outros: Consulte as configurações SMTP do seu provedor

### 3. Instalar dependências

```bash
cd api
npm install
```

## Executar

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

## Banco de Dados

O banco de dados MySQL será criado automaticamente na primeira execução usando o schema em `schema.sql`.

O arquivo `schema.sql` contém:
- Criação do banco de dados `auth_db`
- Criação das tabelas: `users`, `verification_codes`, `licenses`
- Criação de índices para melhor performance

**Nota:** Certifique-se de que o usuário MySQL tem permissões para criar bancos de dados.

## Estrutura do Banco

- **users**: Armazena usuários cadastrados
- **verification_codes**: Armazena códigos de verificação temporários
- **licenses**: Armazena licenças do sistema

## Endpoints

- `POST /api/login` - Login de usuário
- `POST /api/send-verification-code` - Enviar código de verificação por email
- `POST /api/register` - Registrar novo usuário com código de verificação
- `POST /api/verify` - Verificar sessão
- `POST /api/logout` - Logout

## Notas

- Os códigos de verificação expiram em 10 minutos
- Códigos expirados são limpos automaticamente a cada 5 minutos
- A assinatura padrão é de 30 dias
- O sistema usa connection pooling para melhor performance

## Compatibilidade

O schema SQL é compatível com:
- MySQL 5.7+
- MariaDB 10.2+
- H2 Database (com pequenas adaptações)
