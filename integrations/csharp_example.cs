// Exemplo de integração C# com a API de autenticação
// Similar ao KeyUnit

using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AuthIntegration
{
    public class AuthAPI
    {
        private readonly string baseURL = "https://api.keyunit.online/api/1.3";
        private string sessionID = "";
        private readonly HttpClient httpClient;

        public AuthAPI()
        {
            httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri(baseURL);
        }

        // Login
        public async Task<bool> LoginAsync(string username, string password)
        {
            try
            {
                var data = new
                {
                    username = username,
                    password = password
                };

                var json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("/api/login", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                var result = JsonSerializer.Deserialize<ApiResponse>(responseContent);

                if (result.success)
                {
                    sessionID = result.info.sessionid;
                    Console.WriteLine("Login realizado com sucesso!");
                    return true;
                }
                else
                {
                    Console.WriteLine($"Erro: {result.message}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao fazer login: {ex.Message}");
                return false;
            }
        }

        // Verificar sessão
        public async Task<bool> VerifyAsync()
        {
            if (string.IsNullOrEmpty(sessionID))
            {
                Console.WriteLine("Nenhuma sessão ativa");
                return false;
            }

            try
            {
                var data = new
                {
                    sessionid = sessionID
                };

                var json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("/api/verify", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                var result = JsonSerializer.Deserialize<ApiResponse>(responseContent);

                if (result.success)
                {
                    Console.WriteLine("Sessão válida!");
                    return true;
                }
                else
                {
                    Console.WriteLine($"Sessão inválida: {result.message}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao verificar sessão: {ex.Message}");
                return false;
            }
        }

        // Logout
        public async Task LogoutAsync()
        {
            if (string.IsNullOrEmpty(sessionID)) return;

            try
            {
                var data = new
                {
                    sessionid = sessionID
                };

                var json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                await httpClient.PostAsync("/api/logout", content);
                sessionID = "";
                Console.WriteLine("Logout realizado");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao fazer logout: {ex.Message}");
            }
        }

        public string GetSessionID()
        {
            return sessionID;
        }
    }

    // Classes para deserialização JSON
    public class ApiResponse
    {
        public bool success { get; set; }
        public string message { get; set; }
        public UserInfo info { get; set; }
    }

    public class UserInfo
    {
        public string username { get; set; }
        public string subscription { get; set; }
        public DateTime expires { get; set; }
        public string sessionid { get; set; }
    }

    // Exemplo de uso
    class Program
    {
        static async Task Main(string[] args)
        {
            var auth = new AuthAPI();

            // Login
            if (await auth.LoginAsync("usuario", "senha123"))
            {
                Console.WriteLine($"Session ID: {auth.GetSessionID()}");

                // Verificar sessão
                await auth.VerifyAsync();

                // Logout
                await auth.LogoutAsync();
            }
        }
    }
}

