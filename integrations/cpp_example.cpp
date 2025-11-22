// Exemplo de integração C++ com a API de autenticação
// Similar ao KeyUnit

#include <iostream>
#include <string>
#include <curl/curl.h>
#include <json/json.h>

class AuthAPI {
private:
    std::string baseURL = "https://api.keyunit.online/api/1.3";
    std::string sessionID = "";

    // Callback para receber resposta HTTP
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* data) {
        size_t totalSize = size * nmemb;
        data->append((char*)contents, totalSize);
        return totalSize;
    }

    // Fazer requisição POST
    std::string postRequest(const std::string& endpoint, const std::string& data) {
        CURL* curl = curl_easy_init();
        std::string response;

        if (curl) {
            std::string url = baseURL + endpoint;
            
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
            
            struct curl_slist* headers = NULL;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

            CURLcode res = curl_easy_perform(curl);
            curl_easy_cleanup(curl);
            curl_slist_free_all(headers);
        }

        return response;
    }

public:
    // Login
    bool login(const std::string& username, const std::string& password) {
        Json::Value jsonData;
        jsonData["username"] = username;
        jsonData["password"] = password;

        Json::StreamWriterBuilder builder;
        std::string jsonString = Json::writeString(builder, jsonData);

        std::string response = postRequest("/api/login", jsonString);
        
        Json::Value root;
        Json::Reader reader;
        if (reader.parse(response, root)) {
            if (root["success"].asBool()) {
                sessionID = root["info"]["sessionid"].asString();
                std::cout << "Login realizado com sucesso!" << std::endl;
                return true;
            } else {
                std::cout << "Erro: " << root["message"].asString() << std::endl;
                return false;
            }
        }
        return false;
    }

    // Verificar sessão
    bool verify() {
        if (sessionID.empty()) {
            std::cout << "Nenhuma sessão ativa" << std::endl;
            return false;
        }

        Json::Value jsonData;
        jsonData["sessionid"] = sessionID;

        Json::StreamWriterBuilder builder;
        std::string jsonString = Json::writeString(builder, jsonData);

        std::string response = postRequest("/api/verify", jsonString);
        
        Json::Value root;
        Json::Reader reader;
        if (reader.parse(response, root)) {
            if (root["success"].asBool()) {
                std::cout << "Sessão válida!" << std::endl;
                return true;
            } else {
                std::cout << "Sessão inválida: " << root["message"].asString() << std::endl;
                return false;
            }
        }
        return false;
    }

    // Logout
    void logout() {
        if (sessionID.empty()) return;

        Json::Value jsonData;
        jsonData["sessionid"] = sessionID;

        Json::StreamWriterBuilder builder;
        std::string jsonString = Json::writeString(builder, jsonData);

        postRequest("/api/logout", jsonString);
        sessionID = "";
        std::cout << "Logout realizado" << std::endl;
    }

    std::string getSessionID() {
        return sessionID;
    }
};

// Exemplo de uso
int main() {
    curl_global_init(CURL_GLOBAL_DEFAULT);
    
    AuthAPI auth;
    
    // Login
    if (auth.login("usuario", "senha123")) {
        std::cout << "Session ID: " << auth.getSessionID() << std::endl;
        
        // Verificar sessão
        auth.verify();
        
        // Logout
        auth.logout();
    }
    
    curl_global_cleanup();
    return 0;
}

