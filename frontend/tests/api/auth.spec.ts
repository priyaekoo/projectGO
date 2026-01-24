import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---- Ajuste para ES Modules (dirname) ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // -> tradução nome do diretório do caminho

// TRADUÇÕES
// -> filename = Nome do arquivo
// -> fileURLTOPath = arquivo URl para o caminho
//-> dirname = nome do diretório
// -> path.dirname = caminho para o diretorio

// ---- Leitura da fixture auth.json ----
const authPath = path.resolve(__dirname, "../../fixtures/auth.json");
const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));

// -> authPath = caminho da autenticação
// -> path = caminho
// -> parse = analisar
// -> resolve = resolver
// -> read = ler

// ---- URL BASE DA API ----
const API_URL = "http://localhost:3000";

test.describe("API - Login", () => {
  test("CT01 - Login com sucesso retorna token JWT", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: auth.loginValido,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("token");
    expect(body.token.split(".")).toHaveLength(3);
  });

  test("CT02 - Login com senha inválida retorna 401", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: auth.loginSenhaInvalida,
    });

    expect(response.status()).toBe(401);
  });

  test("CT03 - Login com usuário inexistente retorna 401", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: auth.loginUsuarioInexistente,
    });

    expect(response.status()).toBe(401);
  });
});
