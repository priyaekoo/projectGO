function isValidCPF(cpf) {
  if (!cpf) return false;
  const digits = String(cpf).replace(/\D/g, "");
  if (digits.length !== 11) return false;
  // Reject CPFs with all digits equal (e.g., 11111111111)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (arr) => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += Number(arr[i]) * (arr.length + 1 - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const numbers = digits.split("");
  const dv1 = calcCheckDigit(numbers.slice(0, 9));
  const dv2 = calcCheckDigit(numbers.slice(0, 9).concat(String(dv1)));

  return dv1 === Number(numbers[9]) && dv2 === Number(numbers[10]);
}

module.exports = {
  isValidCPF,
};
