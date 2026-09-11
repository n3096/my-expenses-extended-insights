/**
 * Runtime configuration for the insights tool.
 *
 * Note: everything in here is delivered to the browser, so the API key is
 * public by definition. It only guards the read-only exchange-rate endpoint;
 * never put a secret in this file.
 */
export const EXCHANGE_RATE_API = {
    baseUrl: 'https://api.phiwi.de/exchange-rates/v1/EUR',
    key: 'ytSbcPmtlBijIqq8w76uNVJaGNoNTVJp6PfalmLS1w2sqYplRYRyTowotYTC4BnKapsTD4MA3Xs5ipn5TD1tNS4ov31WYKBEzKqnwWtmtS9aie6CwLw0FoCpqkWn5lVt'
};
