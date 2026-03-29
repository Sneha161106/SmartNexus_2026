const axios = require("axios");

const cacheService = require("./cacheService");

async function getExchangeRates(baseCurrency) {
  const currency = baseCurrency.toUpperCase();
  const cacheKey = `rates:${currency}`;
  const cached = await cacheService.get(cacheKey);

  if (cached) {
    return cached;
  }

  const apiUrl = process.env.EXCHANGE_RATE_API_URL || "https://api.exchangerate-api.com/v4/latest";
  const { data } = await axios.get(`${apiUrl}/${currency}`);
  const rates = data.rates || {};

  await cacheService.set(cacheKey, rates, 60 * 60);
  return rates;
}

async function convertAmount({ amount, fromCurrency, toCurrency }) {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) {
    return amount;
  }

  const rates = await getExchangeRates(to);
  const rate = rates[from];

  if (!rate) {
    throw new Error(`Unable to convert from ${from} to ${to}`);
  }

  return Number((amount / rate).toFixed(2));
}

module.exports = {
  getExchangeRates,
  convertAmount
};
