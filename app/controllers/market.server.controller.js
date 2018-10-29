import cache from '../cache/appCache';

module.exports = {
  /**
   * get market info
   */
  market: (req, res, next) => {
    try {
      let market = cache.appCache.get(cache.marketPrefix);
      if (!market) res.json({});
      else res.json(market);
    } catch (e) {
      console.error(e);
    }
  },
  /**
   * get currencyRate info
   */ currencyRate: (req, res, next) => {
    try {
      let rates = cache.appCache.get(cache.currencyRatePrefix);
      if (!rates) res.json({});
      else res.json(rates);
    } catch (e) {
      console.error(e);
    }
  },
};
