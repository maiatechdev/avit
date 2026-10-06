// Formato único de resposta da API: sucesso devolve o corpo; erro devolve { error: codigo, message?: texto }.

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function errorResponse(code: string, status: number, message?: string, headers: Record<string, string> = {}): Response {
  return json(message ? { error: code, message } : { error: code }, status, headers);
}
