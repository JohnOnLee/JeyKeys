import { farmGrid } from './state.js';
import { saveCurrentProfileState } from './profiles.js';

export const FARM_ITEMS = [
  // Seeds (Buyable)
  { id: 'wheat_seed', name: 'Wheat Seed', price: 5, type: 'seed', cropType: 'wheat' },
  { id: 'carrot_seed', name: 'Carrot Seed', price: 10, type: 'seed', cropType: 'carrot' },
  { id: 'corn_seed', name: 'Corn Seed', price: 20, type: 'seed', cropType: 'corn' },
  // Animals (Buyable)
  { id: 'animal_chicken', name: 'Chicken', price: 80, type: 'animal', animalType: 'chicken', tileId: 'tile_0122' },
  { id: 'animal_sheep', name: 'Sheep', price: 150, type: 'animal', animalType: 'sheep', tileId: 'tile_0120' },
  { id: 'animal_cow', name: 'Cow', price: 250, type: 'animal', animalType: 'cow', tileId: 'tile_0121' }
];

export const CROP_MATURATION = {
  wheat: ['tile_0064', 'tile_0065', 'tile_0066', 'tile_0067'],
  carrot: ['tile_0004', 'tile_0005', 'tile_0006', 'tile_0008'],
  corn: ['tile_0028', 'tile_0029', 'tile_0030', 'tile_0031']
};

export const MARKET_PRICES = {
  wheat: 15,
  carrot: 30,
  corn: 65,
  egg: 20,
  wool: 45,
  milk: 80
};

export function tickFarmGrowth() {
  farmGrid.update((grid) => {
    return grid.map((cell) => {
      // Crops: only grow if watered is true. When they grow, reset watered to false.
      // If not watered or already mature, they stay in the current stage.
      if (cell.type === 'crop') {
        if (cell.watered && cell.cropStage < 3) {
          const nextStage = cell.cropStage + 1;
          const cropStages = CROP_MATURATION[cell.cropType];
          const nextTileId = cropStages ? cropStages[nextStage] : cell.tileId;
          return {
            ...cell,
            cropStage: nextStage,
            tileId: nextTileId,
            watered: false
          };
        }
        return cell;
      }

      // Animals: if !hasProduct, roll production chance: 60% if watered (fed), 15% if dry.
      // If they successfully produce, set hasProduct = true and reset watered = false.
      // If they do NOT produce, keep watered as true (do not waste their food/water!).
      if (cell.type === 'animal') {
        if (!cell.hasProduct) {
          const chance = cell.watered ? 0.60 : 0.15;
          if (Math.random() < chance) {
            return {
              ...cell,
              hasProduct: true,
              watered: false
            };
          }
          // Do not produce, so keep watered as is (e.g. true if they were watered)
          return cell;
        }
        return cell;
      }

      return cell;
    });
  });

  saveCurrentProfileState();
}
