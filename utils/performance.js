// 计算投资组合总体表现
function calculatePortfolioPerformance(portfolio) {
  let totalValue = 0;
  let totalCost = 0;
  let profitLoss = 0;

  portfolio.assets.forEach(asset => {
    const assetValue = asset.quantity * asset.price;
    const assetCost = asset.quantity * asset.purchase_price;

    totalValue += assetValue;
    totalCost += assetCost;
    profitLoss += (assetValue - assetCost);
  });

  return {
    total_value: totalValue,
    total_cost: totalCost,
    profit_loss: profitLoss,
    return_percentage: (profitLoss / totalCost) * 100 || 0
  };
}

// 计算单个资产表现
function calculateAssetPerformance(asset) {
  const currentValue = asset.quantity * asset.price;
  const costBasis = asset.quantity * asset.purchase_price;
  const profitLoss = currentValue - costBasis;

  return {
    ...asset,
    current_value: currentValue,
    profit_loss: profitLoss,
    return_percentage: (profitLoss / costBasis) * 100 || 0
  };
}

module.exports = {
  calculatePortfolioPerformance,
  calculateAssetPerformance
};