const BeginnerStrategy = require('./BeginnerStrategy');
const IntermediateStrategy = require('./IntermediateStrategy');
const AdvancedStrategy = require('./AdvancedStrategy');
const { normalizeFitnessLevel } = require('../constants/fitnessLevels');

const STRATEGIES = {
    beginner: BeginnerStrategy,
    intermediate: IntermediateStrategy,
    advanced: AdvancedStrategy
};

const getStrategy = (level) => {
    const normalized = normalizeFitnessLevel(level);
    const StrategyClass = STRATEGIES[normalized] || BeginnerStrategy;
    return new StrategyClass();
};

module.exports = {
    getStrategy
};
