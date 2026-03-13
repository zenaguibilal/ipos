import type { BreadClient } from './types';

export const BREAD_WEEK_DAYS: (keyof NonNullable<BreadClient['jours_semaine']>)[] = [
    'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
];

export const BREAD_WEEK_DAY_LABELS: Record<keyof NonNullable<BreadClient['jours_semaine']>, string> = {
    lundi: 'Lun',
    mardi: 'Mar',
    mercredi: 'Mer',
    jeudi: 'Jeu',
    vendredi: 'Ven',
    samedi: 'Sam',
    dimanche: 'Dim',
};

export const BREAD_WEEK_DAY_LABELS_FULL: Record<keyof NonNullable<BreadClient['jours_semaine']>, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche',
};
