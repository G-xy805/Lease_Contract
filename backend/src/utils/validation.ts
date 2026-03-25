export const validateIdCard = (idcard: string | null | undefined): boolean => {
  if (!idcard) return true;
  const regex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/i;
  return regex.test(idcard);
};

export const validatePhone = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};

export const validateAmount = (amount: number | null | undefined): boolean => {
  if (amount === null || amount === undefined) return true;
  if (typeof amount !== 'number' || amount < 0) return false;
  const str = amount.toString();
  const decimalIndex = str.indexOf('.');
  if (decimalIndex !== -1 && str.length - decimalIndex > 3) return false;
  return true;
};