-- Exemplo de integração Lua com a API de autenticação
-- Similar ao KeyUnit
-- Requer: luarocks install httpclient json

local http = require("socket.http")
local json = require("json")
local ltn12 = require("ltn12")

local AuthAPI = {}
AuthAPI.__index = AuthAPI

function AuthAPI:new()
    local obj = {
        baseURL = "https://api.gouc.com.br/api/1.3",
        sessionID = ""
    }
    setmetatable(obj, self)
    return obj
end

-- Fazer requisição POST
function AuthAPI:postRequest(endpoint, data)
    local url = self.baseURL .. endpoint
    local response_body = {}
    
    local jsonData = json.encode(data)
    
    local res, code, headers = http.request {
        url = url,
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Content-Length"] = #jsonData
        },
        source = ltn12.source.string(jsonData),
        sink = ltn12.sink.table(response_body)
    }
    
    if code == 200 then
        return json.decode(table.concat(response_body))
    else
        return nil, "HTTP Error: " .. tostring(code)
    end
end

-- Login
function AuthAPI:login(username, password)
    local data = {
        username = username,
        password = password
    }
    
    local result, err = self:postRequest("/api/login", data)
    
    if result and result.success then
        self.sessionID = result.info.sessionid
        print("Login realizado com sucesso!")
        return true
    else
        print("Erro: " .. (err or result.message or "Erro desconhecido"))
        return false
    end
end

-- Verificar sessão
function AuthAPI:verify()
    if self.sessionID == "" then
        print("Nenhuma sessão ativa")
        return false
    end
    
    local data = {
        sessionid = self.sessionID
    }
    
    local result, err = self:postRequest("/api/verify", data)
    
    if result and result.success then
        print("Sessão válida!")
        return true
    else
        print("Sessão inválida: " .. (err or result.message or "Erro desconhecido"))
        return false
    end
end

-- Logout
function AuthAPI:logout()
    if self.sessionID == "" then
        return
    end
    
    local data = {
        sessionid = self.sessionID
    }
    
    self:postRequest("/api/logout", data)
    self.sessionID = ""
    print("Logout realizado")
end

function AuthAPI:getSessionID()
    return self.sessionID
end

-- Exemplo de uso
local auth = AuthAPI:new()

-- Login
if auth:login("usuario", "senha123") then
    print("Session ID: " .. auth:getSessionID())
    
    -- Verificar sessão
    auth:verify()
    
    -- Logout
    auth:logout()
end

