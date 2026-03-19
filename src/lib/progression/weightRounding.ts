/**
 * WEIGHT ROUNDING
 * Rounds recommended weights to realistic gym increments based on loading type.
 */

import type { LoadingType } from "./exerciseProfiles";

/**
 * Round a weight value to the nearest realistic increment based on loading type.
 */
export function roundWeight(weight: number, loading_type: LoadingType): number {
    if (weight <= 0) return 0;

    switch (loading_type) {
        case "barbell":
        case "smith_machine":
            // Nearest 2.5 kg
            return Math.round(weight / 2.5) * 2.5;

        case "dumbbell_pair":
        case "single_dumbbell":
            // Nearest 2 kg (common dumbbell steps)
            return Math.round(weight / 2) * 2;

        case "machine_stack":
        case "cable":
        case "assisted_bodyweight":
            // Nearest 5 kg (machine selector plates)
            return Math.round(weight / 5) * 5;

        case "plate_loaded_machine":
            // Nearest 5 kg for moderate changes, ensure multiple of 2.5 for fine control
            return Math.round(weight / 5) * 5;

        case "bodyweight":
            // External load if weighted (e.g. weighted pull-up), nearest 2.5
            return weight === 0 ? 0 : Math.round(weight / 2.5) * 2.5;

        default:
            return Math.round(weight / 2.5) * 2.5;
    }
}
