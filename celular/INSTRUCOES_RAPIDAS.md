# ⚡ Instruções Rápidas - Gerar APK Android

## 1️⃣ Instalar Dependências (apenas uma vez)
```bash
npm install
```

## 2️⃣ Build e Sincronizar
```bash
npm run build:android
```

## 3️⃣ Abrir no Android Studio
```bash
npm run android:open
```

## 4️⃣ Gerar APK no Android Studio
1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Aguarde o build
3. Clique em **locate** quando aparecer a notificação
4. APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🔧 Pré-requisitos
- Android Studio instalado
- Java JDK 17+
- Variável `ANDROID_HOME` configurada

Ver `README_ANDROID.md` para instruções detalhadas!
