import { describe, expect, it } from 'vitest';
import {
  SIMREADY_CATALOG,
  OBJECT_ELEVATION_PRESETS,
  getCatalogItemsForMode,
  computeRoomTechnicalSummary,
  inferAssetPlacementAndSpec,
  type FunctionalAssetRole,
  type TechnicalSpecLevel1,
} from '../objectsCatalog';

describe('objectsCatalogClassification - Fase 2: Reclasificación de Assets y Metadatos Técnicos', () => {
  describe('1. Tipos y Consistencia del Catálogo (100% de assets clasificados)', () => {
    it('asigna un placementMode válido ("build_props" o "planting_utility") a cada item del catálogo', () => {
      expect(SIMREADY_CATALOG.length).toBeGreaterThan(0);
      for (const item of SIMREADY_CATALOG) {
        expect(['build_props', 'planting_utility']).toContain(item.placementMode);
        if (item.placementMode === 'planting_utility') {
          expect(item.technicalSpec).toBeDefined();
          expect(item.technicalSpec?.role).toBeDefined();
          expect(typeof item.technicalSpec?.iotBindable).toBe('boolean');
        } else {
          expect(item.technicalSpec).toBeUndefined();
        }
      }
    });

    it('estandariza OBJECT_ELEVATION_PRESETS con las alturas canónicas', () => {
      expect(OBJECT_ELEVATION_PRESETS.floor).toBe(0);
      expect(OBJECT_ELEVATION_PRESETS.pallet).toBe(0.21);
      expect(OBJECT_ELEVATION_PRESETS.rack).toBe(0.5);
      expect(OBJECT_ELEVATION_PRESETS.table).toBe(0.93);
    });
  });

  describe('2. Clasificación Determinista (inferAssetPlacementAndSpec)', () => {
    describe('A. Clima, Ventilación y Filtrado (climate_control, iotBindable: true)', () => {
      it('clasifica calefactores con thermalDeltaC +5 y airflowM3h 400', () => {
        const spec = inferAssetPlacementAndSpec('climate_heater_electricBox_a01', 'mep_climate', 'hvac_cooling');
        expect(spec.placementMode).toBe('planting_utility');
        expect(spec.technicalSpec).toEqual({
          role: 'climate_control',
          iotBindable: true,
          thermalDeltaC: 5,
          airflowM3h: 400,
        });
      });

      it('clasifica humidificadores con humidityControl "humidify" y airflowM3h 250', () => {
        const spec = inferAssetPlacementAndSpec('humidifier_a01', 'mep_climate', 'hvac_cooling');
        expect(spec.placementMode).toBe('planting_utility');
        expect(spec.technicalSpec).toEqual({
          role: 'climate_control',
          iotBindable: true,
          humidityControl: 'humidify',
          airflowM3h: 250,
        });
      });

      it('clasifica ventiladores, extractores, filtros y HVAC con thermalDeltaC -2, airflowM3h 800 y humidityControl "stabilize"', () => {
        const fan = inferAssetPlacementAndSpec('fan_axial_floor_a01', 'mep_climate', 'ventilation_fans');
        expect(fan.placementMode).toBe('planting_utility');
        expect(fan.technicalSpec).toEqual({
          role: 'climate_control',
          iotBindable: true,
          thermalDeltaC: -2,
          airflowM3h: 800,
          humidityControl: 'stabilize',
        });

        const extractor = inferAssetPlacementAndSpec('appliance_extractor_a01', 'mep_climate', 'ventilation_fans');
        expect(extractor.placementMode).toBe('planting_utility');
        expect(extractor.technicalSpec?.thermalDeltaC).toBe(-2);
        expect(extractor.technicalSpec?.airflowM3h).toBe(800);
        expect(extractor.technicalSpec?.humidityControl).toBe('stabilize');

        const filter = inferAssetPlacementAndSpec('airSystem_air_filter_a01', 'mep_climate', 'ventilation_fans');
        expect(filter.placementMode).toBe('planting_utility');
        expect(filter.technicalSpec?.airflowM3h).toBe(800);
      });
    });

    describe('B. Riego y Fertigación (irrigation_fertigation, iotBindable: true)', () => {
      it('clasifica tanques IBC con capacidad de 1000 L', () => {
        const ibc = inferAssetPlacementAndSpec('ibcTank_a02', 'mep_climate', 'tanks_drainage');
        expect(ibc.placementMode).toBe('planting_utility');
        expect(ibc.technicalSpec).toEqual({
          role: 'irrigation_fertigation',
          iotBindable: true,
          waterCapacityLiters: 1000,
        });
      });

      it('clasifica reservorios estándar con capacidad de 250 L', () => {
        const reservoir = inferAssetPlacementAndSpec(
          'coolingSystem_coolant_reservoir_tank_a01',
          'mep_climate',
          'tanks_drainage',
        );
        expect(reservoir.placementMode).toBe('planting_utility');
        expect(reservoir.technicalSpec).toEqual({
          role: 'irrigation_fertigation',
          iotBindable: true,
          waterCapacityLiters: 250,
        });
      });

      it('clasifica bombas, mangueras y tuberías con caudal de 45 LPM', () => {
        const pump = inferAssetPlacementAndSpec('drainage_pumpSystem_a01', 'mep_climate', 'tanks_drainage');
        expect(pump.placementMode).toBe('planting_utility');
        expect(pump.technicalSpec).toEqual({
          role: 'irrigation_fertigation',
          iotBindable: true,
          flowRateLpm: 45,
        });

        const hose = inferAssetPlacementAndSpec('equipment_airHoseReel_retractable_a01', 'mep_climate', 'tanks_drainage');
        expect(hose.placementMode).toBe('planting_utility');
        expect(hose.technicalSpec?.flowRateLpm).toBe(45);

        const pipe = inferAssetPlacementAndSpec('pipe_plastic_gray_b06', 'mep_climate', 'tanks_drainage');
        expect(pipe.placementMode).toBe('planting_utility');
        expect(pipe.technicalSpec?.flowRateLpm).toBe(45);
      });
    });

    describe('C. Contenedores, Mesas y Racks (cultivation_vessel, iotBindable: false)', () => {
      it('clasifica cajones plásticos y baldes con vesselType "pot_container" y 40 L de sustrato', () => {
        const crate = inferAssetPlacementAndSpec('crate_harvest_plastic_green_a01', 'logistics', 'boxes_crates');
        expect(crate.placementMode).toBe('planting_utility');
        expect(crate.technicalSpec).toEqual({
          role: 'cultivation_vessel',
          iotBindable: false,
          vesselType: 'pot_container',
          substrateVolumeLiters: 40,
        });

        const bucket = inferAssetPlacementAndSpec('bucket_utility_red_a01', 'logistics', 'boxes_crates');
        expect(bucket.placementMode).toBe('planting_utility');
        expect(bucket.technicalSpec?.vesselType).toBe('pot_container');
        expect(bucket.technicalSpec?.substrateVolumeLiters).toBe(40);
      });

      it('clasifica mesas de cultivo y trabajo de acero inoxidable con vesselType "propagation_bench" y 120 L', () => {
        const table = inferAssetPlacementAndSpec('table_metal_stainless_a03', 'workbench_furniture', 'workbenches');
        expect(table.placementMode).toBe('planting_utility');
        expect(table.technicalSpec).toEqual({
          role: 'cultivation_vessel',
          iotBindable: false,
          vesselType: 'propagation_bench',
          substrateVolumeLiters: 120,
        });

        const bench = inferAssetPlacementAndSpec('workbench_modular_table_b01', 'workbench_furniture', 'workbenches');
        expect(bench.placementMode).toBe('planting_utility');
        expect(bench.technicalSpec?.vesselType).toBe('propagation_bench');
        expect(bench.technicalSpec?.substrateVolumeLiters).toBe(120);
      });

      it('clasifica racks metálicos reforzados con vesselType "vertical_rack" y 300 L', () => {
        const rack = inferAssetPlacementAndSpec('rack_heavyduty_metal_f01', 'logistics', 'racks_shelves');
        expect(rack.placementMode).toBe('planting_utility');
        expect(rack.technicalSpec).toEqual({
          role: 'cultivation_vessel',
          iotBindable: false,
          vesselType: 'vertical_rack',
          substrateVolumeLiters: 300,
        });

        const industrialRack = inferAssetPlacementAndSpec('rack_industrial_empty_a01', 'logistics', 'racks_shelves');
        expect(industrialRack.placementMode).toBe('planting_utility');
        expect(industrialRack.technicalSpec?.vesselType).toBe('vertical_rack');
        expect(industrialRack.technicalSpec?.substrateVolumeLiters).toBe(300);
      });
    });

    describe('D. Bioprocesamiento y Compostaje (bioprocessing, iotBindable: false)', () => {
      it('clasifica tambores de 200L y tolvas con compostCapacityLiters de 200 L', () => {
        const drum = inferAssetPlacementAndSpec('drum_plastic_black_a05', 'logistics', 'waste_drums');
        expect(drum.placementMode).toBe('planting_utility');
        expect(drum.technicalSpec).toEqual({
          role: 'bioprocessing',
          iotBindable: false,
          compostCapacityLiters: 200,
        });

        const fiberDrum = inferAssetPlacementAndSpec('drum_fiber_a02', 'logistics', 'waste_drums');
        expect(fiberDrum.placementMode).toBe('planting_utility');
        expect(fiberDrum.technicalSpec?.compostCapacityLiters).toBe(200);

        const hopper = inferAssetPlacementAndSpec('hopper_dumpling_steel_red_a07', 'logistics', 'waste_drums');
        expect(hopper.placementMode).toBe('planting_utility');
        expect(hopper.technicalSpec?.compostCapacityLiters).toBe(200);
      });
    });

    describe('E. Todo el resto clasifica a build_props', () => {
      it('asigna build_props y technicalSpec undefined a palets, zorras, carros, cajas de cartón, herramientas, cosechas y seguridad', () => {
        const pallet = inferAssetPlacementAndSpec('pallet_standard_wood_a01', 'logistics', 'pallets');
        expect(pallet.placementMode).toBe('build_props');
        expect(pallet.technicalSpec).toBeUndefined();

        const palletJack = inferAssetPlacementAndSpec('palletjack_standard_a01', 'logistics', 'transport_carts');
        expect(palletJack.placementMode).toBe('build_props');
        expect(palletJack.technicalSpec).toBeUndefined();

        const box = inferAssetPlacementAndSpec('box_corrugated_shipping_a01', 'logistics', 'boxes_crates');
        expect(box.placementMode).toBe('build_props');
        expect(box.technicalSpec).toBeUndefined();

        const chair = inferAssetPlacementAndSpec('chair_office_fabric_manager_a01', 'workbench_furniture', 'seating');
        expect(chair.placementMode).toBe('build_props');
        expect(chair.technicalSpec).toBeUndefined();

        const tool = inferAssetPlacementAndSpec('handTool_wrench_combination_a01', 'hand_tools', 'hand_tools');
        expect(tool.placementMode).toBe('build_props');
        expect(tool.technicalSpec).toBeUndefined();

        const produce = inferAssetPlacementAndSpec('produce_tomato_fruit_a01', 'harvest_produce', 'vegetables');
        expect(produce.placementMode).toBe('build_props');
        expect(produce.technicalSpec).toBeUndefined();

        const safety = inferAssetPlacementAndSpec('fireProtection_fireExtinguisher_a01', 'safety', 'fire_protection');
        expect(safety.placementMode).toBe('build_props');
        expect(safety.technicalSpec).toBeUndefined();
      });
    });
  });

  describe('3. Funciones de Filtrado y Resumen Técnico de Sala', () => {
    it('getCatalogItemsForMode separa el catálogo en dos conjuntos disjuntos y exhaustivos', () => {
      const buildProps = getCatalogItemsForMode('build_props');
      const plantingUtilities = getCatalogItemsForMode('planting_utility');

      expect(buildProps.length).toBeGreaterThan(0);
      expect(plantingUtilities.length).toBeGreaterThan(0);
      expect(buildProps.length + plantingUtilities.length).toBe(SIMREADY_CATALOG.length);

      expect(buildProps.every((item) => item.placementMode === 'build_props')).toBe(true);
      expect(plantingUtilities.every((item) => item.placementMode === 'planting_utility')).toBe(true);
    });

    it('computeRoomTechnicalSummary calcula métricas agregadas para una sala con equipamiento variado', () => {
      const placedObjects = [
        { assetId: 'ibcTank_a02' }, // water: 1000, iot: true
        { assetId: 'drainage_pumpSystem_a01' }, // flow: 45, iot: true
        { assetId: 'fan_axial_floor_a01' }, // airflow: 800, delta: -2, iot: true
        { assetId: 'crate_harvest_plastic_green_a01' }, // substrate: 40
        { assetId: 'crate_harvest_plastic_green_a01' }, // substrate: 40
        { assetId: 'drum_plastic_black_a05' }, // compost: 200
        { assetId: 'pallet_standard_wood_a01' }, // build_prop (no suma)
      ];

      const summary = computeRoomTechnicalSummary(placedObjects);

      expect(summary.totalWaterCapacityLiters).toBe(1000);
      expect(summary.totalAirflowM3h).toBe(800);
      expect(summary.netThermalDeltaC).toBe(-2);
      expect(summary.totalSubstrateVolumeLiters).toBe(80);
      expect(summary.totalCompostCapacityLiters).toBe(200);
      expect(summary.iotReadyDevicesCount).toBe(3);
      expect(summary.hasActiveIrrigation).toBe(true);
    });

    it('computeRoomTechnicalSummary acota netThermalDeltaC entre -8°C y +12°C', () => {
      // 5 calefactores (+5 cada uno = +25, acotado a +12)
      const hotRoom = [
        { assetId: 'climate_heater_electricBox_a01' },
        { assetId: 'climate_heater_electricBox_a01' },
        { assetId: 'climate_heater_electricBox_a01' },
        { assetId: 'climate_heater_electricBox_a01' },
        { assetId: 'climate_heater_electricBox_a01' },
      ];
      expect(computeRoomTechnicalSummary(hotRoom).netThermalDeltaC).toBe(12);

      // 6 ventiladores (-2 cada uno = -12, acotado a -8)
      const coldRoom = [
        { assetId: 'fan_axial_floor_a01' },
        { assetId: 'fan_axial_floor_a01' },
        { assetId: 'fan_axial_floor_a01' },
        { assetId: 'fan_axial_floor_a01' },
        { assetId: 'fan_axial_floor_a01' },
        { assetId: 'fan_axial_floor_a01' },
      ];
      expect(computeRoomTechnicalSummary(coldRoom).netThermalDeltaC).toBe(-8);
    });

    it('computeRoomTechnicalSummary requiere tanto reservorio como bombeo/flujo para hasActiveIrrigation', () => {
      // Solo tanque sin bomba
      const tankOnly = computeRoomTechnicalSummary([{ assetId: 'ibcTank_a02' }]);
      expect(tankOnly.hasActiveIrrigation).toBe(false);

      // Solo bomba sin tanque
      const pumpOnly = computeRoomTechnicalSummary([{ assetId: 'drainage_pumpSystem_a01' }]);
      expect(pumpOnly.hasActiveIrrigation).toBe(false);

      // Tanque + Bomba
      const both = computeRoomTechnicalSummary([
        { assetId: 'ibcTank_a02' },
        { assetId: 'drainage_pumpSystem_a01' },
      ]);
      expect(both.hasActiveIrrigation).toBe(true);
    });

    it('computeRoomTechnicalSummary devuelve ceros y hasActiveIrrigation false para una sala vacía', () => {
      const summary = computeRoomTechnicalSummary([]);
      expect(summary).toEqual({
        totalWaterCapacityLiters: 0,
        totalAirflowM3h: 0,
        netThermalDeltaC: 0,
        totalSubstrateVolumeLiters: 0,
        totalCompostCapacityLiters: 0,
        iotReadyDevicesCount: 0,
        hasActiveIrrigation: false,
      });
    });
  });
});
