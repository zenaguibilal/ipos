import type { Customer } from './types';

export const BREAD_WEEK_DAYS: (keyof NonNullable<Customer['bread_jours_semaine']>)[] = [
    'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
];

export const BREAD_WEEK_DAY_LABELS_FULL: Record<keyof NonNullable<Customer['bread_jours_semaine']>, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche',
};