import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10, // número de usuários virtuais
  duration: "30s", // duração do teste
};

export default function () {
  const payload = JSON.stringify({
    usuario: "adm@email.com",
    senha: "123456",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post("http://127.0.0.1:3000/auth/login", payload, params);

  check(res, {
    "status 200": (r) => r.status === 200,
    "retornou token": (r) => {
      try {
        return JSON.parse(r.body).token !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
  console.log(`STATUS: ${res.status}`);
  console.log(`BODY: ${res.body}`);
}
