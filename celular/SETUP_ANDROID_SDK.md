# 🔧 Configurar Android SDK

## Problema
O Android SDK não está instalado ou configurado.

## ✅ Solução Rápida

### Opção 1: Abrir no Android Studio (Recomendado)
O Android Studio irá baixar e configurar o SDK automaticamente:

```bash
npm run android:open
```

Quando o Android Studio abrir pela primeira vez:
1. Ele vai perguntar sobre o SDK
2. Clique em **Next** e **Finish** para baixar o SDK
3. Aguarde o download terminar
4. Depois vá em **Build** → **Build APK(s)**

### Opção 2: Configurar SDK Manualmente

1. Abra o **Android Studio**
2. Vá em **Tools** → **SDK Manager**
3. Na aba **SDK Platforms**, selecione:
   - ✅ Android 13.0 (Tiramisu) - API 33
   - ✅ Android 14.0 (UpsideDownCake) - API 34
4. Na aba **SDK Tools**, certifique-se de ter:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Command-line Tools
5. Clique em **Apply** e aguarde a instalação
6. O SDK será instalado em: `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`

### Opção 3: Criar local.properties Manualmente

Se o SDK já está instalado, crie o arquivo `android\local.properties`:

```properties
sdk.dir=C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

**Substitua `SEU_USUARIO` pelo seu nome de usuário do Windows!**

## 🚀 Depois de Configurar

Depois que o SDK estiver configurado, você pode gerar o APK:

```bash
# Gerar APK via linha de comando
cd android
.\gradlew.bat assembleDebug
```

Ou use o Android Studio:
1. Abra o projeto: `npm run android:open`
2. **Build** → **Build APK(s)**
3. O APK estará em: `android\app\build\outputs\apk\debug\app-debug.apk`
