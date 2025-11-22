# 🚀 Gerar APK - Passo a Passo Rápido

## ⚡ Método Rápido (Android Studio)

### Passo 1: Build e Sincronizar
```bash
npm run build:android
```

### Passo 2: Abrir no Android Studio
```bash
npm run android:open
```

### Passo 3: Gerar APK no Android Studio

1. Aguarde o Android Studio carregar o projeto (pode demorar na primeira vez)
2. Quando o projeto carregar, vá no menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Aguarde o build finalizar (barra de progresso na parte inferior)
4. Quando aparecer a notificação de sucesso, clique em **locate** ou **locate link**
5. O APK estará em: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## 🔧 Método Via Linha de Comando (Require Java JDK)

### Pré-requisito: Instalar Java JDK

1. Baixe o [Java JDK 17](https://www.oracle.com/java/technologies/downloads/#java17-windows)
2. Instale o JDK
3. Configure a variável de ambiente:
   - Abra **Painel de Controle** → **Sistema** → **Configurações avançadas do sistema**
   - Clique em **Variáveis de Ambiente**
   - Em **Variáveis do sistema**, clique em **Novo**
   - Nome: `JAVA_HOME`
   - Valor: `C:\Program Files\Java\jdk-17` (ajuste para o caminho da sua instalação)
   - Clique em **OK**
   - Edite a variável **Path** e adicione: `%JAVA_HOME%\bin`
   - Clique em **OK** em todas as janelas
   - **Reinicie o PowerShell/Terminal**

### Verificar Instalação
```powershell
java -version
```

### Gerar APK
```bash
# 1. Build e sincronizar
npm run build:android

# 2. Gerar APK
cd android
.\gradlew.bat assembleDebug
```

O APK estará em: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## 📱 Instalar APK no Dispositivo

### Método 1: Via USB
1. Conecte o dispositivo Android via USB
2. Ative **Depuração USB** no dispositivo
3. No Android Studio, clique em **Run** (▶️) e selecione seu dispositivo

### Método 2: Transferir APK
1. Copie o arquivo `app-debug.apk` para o dispositivo
2. No dispositivo, abra o arquivo e instale
3. Se necessário, ative **Instalar apps desconhecidos** nas configurações

---

## 🎯 APK de Release (Assinado)

Para gerar um APK assinado para produção:

1. No Android Studio: **Build** → **Generate Signed Bundle / APK**
2. Selecione **APK**
3. Clique em **Create new...** para criar keystore
4. Preencha os dados (guarde a senha!)
5. Selecione **release**
6. O APK estará em: `android\app\build\outputs\apk\release\app-release.apk`

---

## ✅ Status Atual do Projeto

✅ Projeto Android configurado  
✅ Permissões configuradas  
✅ API configurada para Android  
✅ Build da aplicação web funcionando  
✅ Pronto para gerar APK  

**Recomendação:** Use o Android Studio para gerar o APK (método mais simples e confiável)!
