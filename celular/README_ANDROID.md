# 📱 Auth System - Versão Android (APK)

Este guia explica como gerar o APK Android da aplicação Auth System, que é 100% idêntica à versão web.

## 📋 Pré-requisitos

### 1. Instalar Android Studio
- Baixe e instale o [Android Studio](https://developer.android.com/studio)
- Durante a instalação, certifique-se de instalar:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (AVD) - opcional para emulador

### 2. Configurar Variáveis de Ambiente
Adicione as seguintes variáveis de ambiente no Windows:

```powershell
ANDROID_HOME = C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
```

Adicione ao PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

### 3. Instalar Java JDK
- Baixe e instale o [Java JDK 17 ou superior](https://www.oracle.com/java/technologies/downloads/)

### 4. Verificar Instalação
```bash
java -version
adb version
```

## 🚀 Build e Geração do APK

### Passo 1: Build da Aplicação Web
```bash
npm run build
```

### Passo 2: Sincronizar com Android
```bash
npm run android:sync
```

### Passo 3: Abrir no Android Studio
```bash
npm run android:open
```

### Passo 4: Gerar APK no Android Studio

#### Para APK de Debug (teste):
1. No Android Studio, vá em **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Aguarde o build finalizar
3. Quando concluir, clique em **locate** no aviso de sucesso
4. O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Para APK de Release (produção):
1. No Android Studio, vá em **Build** → **Generate Signed Bundle / APK**
2. Selecione **APK** e clique em **Next**
3. Clique em **Create new...** para criar uma nova keystore:
   - **Key store path**: Escolha um local e nome para o arquivo `.jks`
   - **Password**: Defina uma senha forte
   - **Alias**: Nome do alias (ex: `keyunit-release`)
   - **Password do alias**: Senha do alias
   - **Validity**: 25 anos ou mais
   - Clique em **OK**
4. Preencha os dados da keystore e clique em **Next**
5. Selecione **release** como build variant
6. Selecione **V1 (Jar Signature)** e **V2 (Full APK Signature)**
7. Clique em **Finish**
8. O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

## 📝 Scripts Disponíveis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build da aplicação web
npm run build
```

### Android
```bash
# Build e sincronizar com Android
npm run build:android

# Abrir projeto no Android Studio
npm run android:open

# Sincronizar arquivos web com Android
npm run android:sync

# Copiar arquivos web para Android
npm run android:copy

# Build completo e abrir no Android Studio
npm run android:run
```

## 🔧 Configurações Importantes

### Permissões Android
O aplicativo já está configurado com as seguintes permissões:
- ✅ **INTERNET**: Para comunicação com a API
- ✅ **usesCleartextTraffic**: Permite HTTP (não apenas HTTPS)
- ✅ **Network Security Config**: Configurado para permitir comunicação com `api.keyunit.online`

### Configuração da API
O aplicativo detecta automaticamente quando está rodando no Android e usa a URL:
```
https://api.keyunit.online
```

Para alterar a URL da API, edite o arquivo `src/services/api.js`.

## 📱 Testando o APK

### Emulador Android
1. Abra o Android Studio
2. Crie um AVD (Android Virtual Device) se ainda não tiver
3. Inicie o emulador
4. No Android Studio, clique em **Run** (▶️) ou pressione `Shift + F10`
5. Selecione o emulador e clique em **OK**

### Dispositivo Físico
1. Ative as **Opções do Desenvolvedor** no seu dispositivo Android:
   - Vá em **Configurações** → **Sobre o telefone**
   - Toque 7 vezes em **Número da versão**
2. Ative **Depuração USB**:
   - Vá em **Configurações** → **Opções do desenvolvedor**
   - Ative **Depuração USB**
3. Conecte o dispositivo via USB ao computador
4. Autorize a depuração USB quando solicitado
5. No Android Studio, clique em **Run** e selecione seu dispositivo

### Instalar APK Manualmente
1. Transfira o arquivo `.apk` para o dispositivo Android
2. No dispositivo, vá em **Configurações** → **Segurança**
3. Ative **Fontes desconhecidas** ou **Instalar apps desconhecidos**
4. Abra o arquivo `.apk` e instale

## 🐛 Solução de Problemas

### Erro: "SDK location not found"
- Configure a variável de ambiente `ANDROID_HOME`
- Ou crie um arquivo `local.properties` em `android/` com:
  ```
  sdk.dir=C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
  ```

### Erro: "Command not found: adb"
- Adicione `%ANDROID_HOME%\platform-tools` ao PATH
- Reinicie o terminal/PowerShell

### Erro: "Gradle build failed"
- No Android Studio, vá em **File** → **Sync Project with Gradle Files**
- Ou execute no terminal: `cd android && ./gradlew clean`

### App não conecta com a API
- Verifique se a permissão `INTERNET` está no `AndroidManifest.xml`
- Verifique se `usesCleartextTraffic="true"` está configurado
- Verifique a URL da API em `src/services/api.js`

### Build muito lento
- Aumente a memória do Gradle: crie `android/gradle.properties` com:
  ```
  org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
  ```

## 📦 Estrutura do Projeto

```
auth/
├── android/                    # Projeto Android nativo
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── res/
│   │           └── xml/
│   │               └── network_security_config.xml
│   └── ...
├── src/                        # Código fonte React
├── dist/                       # Build da aplicação web
├── capacitor.config.js         # Configuração do Capacitor
└── package.json               # Dependências e scripts
```

## 🔄 Atualizando o App

Após fazer alterações no código React:

1. **Build da aplicação:**
   ```bash
   npm run build
   ```

2. **Sincronizar com Android:**
   ```bash
   npm run android:sync
   ```

3. **Rebuild no Android Studio:**
   - Clique em **Build** → **Rebuild Project**
   - Ou use **Run** para instalar e testar

## 📞 Suporte

Para problemas ou dúvidas:
- Verifique os logs no Android Studio (aba **Logcat**)
- Verifique os logs do navegador no aplicativo (habilite debugging no `capacitor.config.js`)

---

**✅ O aplicativo Android é 100% idêntico à versão web, mantendo todas as funcionalidades!**
