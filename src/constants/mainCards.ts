import { MainCard, SecondaryRule, SessionMetrics } from '../types/mainCard';

const softcap = (x: number, cap: number) => cap * (1 - Math.exp(-x / cap));

export const SECONDARY_RULES: SecondaryRule[] = [
    {
        icon: 'Hydra',
        shardsToUnlock: 100,
        shardFormula: (m: SessionMetrics) => Math.floor(softcap(m.volumeKg / 800, 8)),
    },
    {
        icon: 'Medusa',
        shardsToUnlock: 100,
        shardFormula: (m: SessionMetrics) => {
            const okTempo = m.cadenceSecPerRep >= 2.0 && m.cadenceSecPerRep <= 4.0;
            return okTempo ? 2 : 0;
        },
    },
    {
        icon: 'Sphinx',
        shardsToUnlock: 100,
        shardFormula: (_m, ctx) => (ctx.runIndex % 3 === 0 ? 1 : 0),
    },
];

export const MAIN_CARDS: MainCard[] = [];
