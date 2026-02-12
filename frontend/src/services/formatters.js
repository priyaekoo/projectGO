/**
 * Formata valor monetario no padrao brasileiro: R$ 100.000,00
 */
export function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Formata percentual no padrao brasileiro: 12,80%
 */
export function formatarPercentual(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + "%";
}
