// This code is designed to run in an n8n 'Code Node'.
// It calculates the delta of a concentrated liquidity position
// and determines the required hedge.

// Inputs are expected to be available in the $json object from the previous node.
const P = $json.currentPrice;
const Pa = $json.lowerBound;
const Pb = $json.upperBound;
// Liquidity can be a very large number, so it's received as a string and handled with BigInt.
const L = BigInt($json.liquidity); 
const deadband = 10; // A $10 deadband to prevent hedging insignificant amounts.

let delta = 0;

// The delta calculation depends on where the current price is relative to the liquidity range.
if (P < Pa) {
  // Case 2: Below Range (Position is all in token0)
  // The delta is fixed at the total amount of token0 in the position.
  const sqrtPa = Math.sqrt(Pa);
  const sqrtPb = Math.sqrt(Pb);
  delta = parseFloat(L.toString()) * (1 / sqrtPa - 1 / sqrtPb);

} else if (P >= Pa && P <= Pb) {
  // Case 1: In Range (Position is a mix of token0 and token1)
  // The delta is the current amount of token0 held.
  const sqrtP = Math.sqrt(P);
  const sqrtPb = Math.sqrt(Pb);
  delta = parseFloat(L.toString()) * (1 / sqrtP - 1 / sqrtPb);

} else {
  // Case 3: Above Range (Position is all in token1)
  // The position has no exposure to token0.
  delta = 0;
}

// The required hedge is the negative of the delta.
const hedgeAmount = -delta;

// Determine if a hedge is required by checking if the value of the hedge exceeds the deadband.
const isHedgeRequired = Math.abs(hedgeAmount * P) > deadband;

// Return the results as a JSON object for the next nodes in the workflow.
return {
  delta,
  hedgeAmount,
  isHedgeRequired
};