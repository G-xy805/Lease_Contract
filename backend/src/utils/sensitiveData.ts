export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.length <= 7) return '***';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

export function maskIdCard(idcard: string | null | undefined): string {
  if (!idcard) return '';
  if (idcard.length <= 8) return '***';
  return idcard.substring(0, 6) + '********' + idcard.substring(idcard.length - 4);
}

export function maskToken(token: string | null | undefined): string {
  if (!token) return '';
  if (token.length <= 12) return '***';
  return token.substring(0, 8) + '...' + token.substring(token.length - 4);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const atIndex = email.indexOf('@');
  if (atIndex <= 2) return '***@' + email.substring(atIndex + 1);
  return email.substring(0, 2) + '***' + email.substring(atIndex);
}
