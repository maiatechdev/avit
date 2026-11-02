// Só a Vercel chama a rotina agendada: ela envia "Authorization: Bearer <CRON_SECRET>".
// Sem CRON_SECRET configurado, a rotina fica fechada, para ninguém disparar a limpeza de fora.
export function isAuthorizedCron(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
