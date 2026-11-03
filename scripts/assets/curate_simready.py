import json
import os
from collections import defaultdict

def classify(item):
    asset = item['asset']
    cat = item.get('category', '')

    # ==========================================
    # 1. HARVEST PRODUCE
    # ==========================================
    # Strictly fresh fruits and vegetables
    if asset.startswith('food_produce_'):
        return 'harvest_produce'

    # ==========================================
    # STRICT EXCLUSIONS
    # ==========================================
    # Medical & Surgical Equipment
    medical_exact_cats = {
        'CT', 'IV', 'Xray', 'anesthesia', 'bandage', 'blood', 'cannulae', 'catheter',
        'clogs', 'defibrillator', 'disinfectant', 'drape', 'facemask', 'headlight',
        'hemodialysis', 'instrument', 'laser', 'lung', 'medicine', 'needle', 'oximeter',
        'pad', 'pendant', 'stethoscope', 'syringe', 'thermometer', 'tray', 'ultrasound',
        'unit', 'warmer', 'wheelChair'
    }
    if cat in medical_exact_cats:
        return None

    medical_prefixes = (
        'CT_', 'IV_', 'Xray_', 'anesthesia_', 'bandage_', 'bed_hospital_', 'blood_',
        'cannulae_', 'catheter_', 'chair_hospital_', 'chair_patient_', 'chair_surgical_',
        'clogs_hospital_', 'defibrillator_', 'device_', 'disinfectant_', 'drape_',
        'facemask_', 'headlight_surgical_', 'hemodialysis_', 'instrument_', 'laser_',
        'lung_', 'mask_nebulization_', 'medical_', 'medicine_', 'needle_', 'oximeter_',
        'pad_vital_', 'pendant_medical_', 'pump_infusion_', 'pump_suction_', 'pump_system_infusion_',
        'robot_surgical_', 'screen_hospital_', 'sign_hospital_', 'sink_surgical_',
        'stapler_surgical_', 'stethoscope_', 'syringe_', 'table_surgical_', 'table_bedside_',
        'thermometer_', 'tool_pen_surgical_', 'tool_power_surgical_', 'tray_sterilization_',
        'ultrasound_', 'unit_electrosurgical_', 'unit_head_bed_', 'warmer_infusion_',
        'wheelChair_', 'container_system_sterilising_', 'cabinet_for_drugs_',
        'cart_medical_utility_', 'trolley_instrument_', 'trolley_emergency_'
    )
    if asset.startswith(medical_prefixes):
        return None

    # Automotive Mechanical Parts & Powertrain
    auto_exact_cats = {
        'bodyPart', 'brakeSystem', 'carFrame', 'drivetrain', 'electricalSystem',
        'engineAssembly', 'engineComponent', 'engine', 'exhaustSystem', 'fuelSystem',
        'interiorPart', 'steeringSystem', 'steering', 'suspension', 'wheelAssembly',
        'testingTool', 'tireTool'
    }
    if cat in auto_exact_cats:
        return None

    auto_prefixes = (
        'bodyPart_', 'brakeSystem_', 'carFrame_', 'drivetrain_', 'electricalSystem_',
        'engineAssembly_', 'engineComponent_', 'engine_', 'exhaustSystem_', 'fuelSystem_',
        'interiorPart_', 'steeringSystem_', 'steering_', 'suspension_', 'wheelAssembly_',
        'testingTool_', 'tireTool_', 'coolingSystem_fan_shroud_', 'coolingSystem_radiator_',
        'coolingSystem_thermostat_', 'serviceTool_ac_recharge_', 'serviceTool_brake_',
        'serviceTool_brakeCaliper_', 'serviceTool_engine_', 'serviceTool_refrigerant_',
        'serviceTool_scanner_', 'serviceTool_separator_ballJointClamp_', 'serviceTool_puller_',
        'serviceTool_compressor_valveSpring_', 'serviceTool_line_disconnectKit_'
    )
    if asset.startswith(auto_prefixes):
        return None

    # Domestic Kitchenware, Home Appliances, Toys, Stationery
    domestic_exact_cats = {
        'toy', 'dishware', 'kitchenware', 'decor', 'stationery', 'stationary',
        'sofa', 'TV', 'video', 'book', 'magazines', 'paperbag', 'paper', 'pack',
        'bedding', 'accessory'
    }
    if cat in domestic_exact_cats:
        return None

    domestic_prefixes = (
        'appliance_dishwasher_', 'appliance_refrigerator_', 'appliance_toaster_',
        'machine_coffee_', 'furniture_counter_coffeeStation_', 'furniture_table_coffee_',
        'facilitySystem_beverageStation_', 'facilityEquipment_beverageFridge_',
        'decor_', 'dishware_', 'kitchenware_', 'sofa_', 'TV_', 'video_',
        'toy_', 'misc_toy_', 'accessory_eyeglasses_', 'misc_eyeGlasses_',
        'misc_golfBall_', 'book_', 'magazines_', 'paperbag_', 'stationery_',
        'misc_notebook_', 'misc_printerPaper_', 'paper_roll_', 'pack_paper_',
        'stationary_', 'bedding_', 'toilet_', 'fauset_', 'washBasin_', 'mirror_',
        'phone_', 'digitalSystem_', 'purifier_clothes_', 'food_', 'food_beverage_',
        'food_dairy_', 'food_egg_', 'food_prepared_', 'food_bottle_', 'food_condiment_',
        'food_processed_', 'food_box_', 'food_fish_', 'food_canned_', 'food_packaged_',
        'food_can_', 'misc_bottle_corked_', 'misc_cube_3in_', 'misc_glass_vase_'
    )
    if asset.startswith(domestic_prefixes):
        return None

    # ==========================================
    # 2. SAFETY & HYGIENE (safety)
    # ==========================================
    # Fire protection, eyewash, first aid, spill containment, PPE, safety barriers/guards
    if cat in ['fireExtinguisher', 'fireProtection', 'safety', 'safetyBoard', 'ppe', 'machineGuard']:
        return 'safety'
    if asset.startswith((
        'fireExtinguisher_', 'fireProtection_', 'safety_', 'safetyBoard_', 'ppe_', 'machineGuard_',
        'tools_fireExtinguisher_', 'construction_fireSafetyPoint_', 'construction_firstAidPoint_',
        'detector_smoke_fire_', 'detector_thermal_fire_', 'warehouse_fireAlarm_wallSwitch_',
        'cabinet_drum_flammable_', 'sign_wetFloor_', 'sign_warning_', 'sign_floor_movable_',
        'tape_safety_', 'barrier_gate_safety', 'wire_machineGuard_', 'environment_barricade_',
        'rail_corner_', 'rail_straight_', 'vehicleSupport_wheel_chock_'
    )):
        return 'safety'

    # ==========================================
    # 3. CLIMATE, VENTILATION & FLUIDS (mep_climate)
    # ==========================================
    # Fans, heaters, extractors, ventilation, HVAC ducts, IBC tanks, fluid reservoirs, air filters, compressors, pumps
    if cat in ['airSystem', 'climate', 'ventilation', 'hvac', 'ibcTank', 'drainage', 'pipe', 'humidifier', 'extractor']:
        return 'mep_climate'
    if asset.startswith((
        'airSystem_', 'climate_', 'ventilation_', 'hvac_', 'ibcTank_', 'drainage_', 'pipe_',
        'humidifier_', 'extractor_', 'appliance_extractor_',
        'coolingSystem_coolant_reservoir_tank_', 'coolingSystem_windshield_washer_reservoir_',
        'equipment_airCompressor_', 'equipment_airDryer_', 'equipment_airHoseReel_',
        'equipment_hoseReel_pressureWasher_', 'equipment_paintPressurePot_', 'equipment_paintPumpSystem_',
        'serviceTool_drainCart_', 'serviceTool_drainPan_', 'serviceTool_fluid_pump_',
        'serviceTool_pump_fluidTransfer', 'serviceTool_waste_oil_tank_', 'serviceTool_vacuum_cleaner_',
        'consumable_air_filter_cylindrical_', 'consumable_cabin_filter_carbon_', 'consumable_cabin_filter_enhanced_',
        'consumable_hose_coolant_', 'consumable_hose_hydraulic_', 'consumable_absorbent_'
    )):
        return 'mep_climate'

    # ==========================================
    # 4. WORKBENCH & FURNITURE (workbench_furniture)
    # ==========================================
    # Workbenches, packing/potting tables, industrial tool cabinets, lockers, work stools
    if cat in ['workstation', 'facilityFurniture']:
        return 'workbench_furniture'
    if asset.startswith((
        'workstation_', 'furniture_workbench_', 'table_deluxe_packing_', 'table_metal_',
        'table_packing_heavyduty_', 'facilityFurniture_lockerUnit_', 'storage_locker_double_bench_',
        'equipment_rolling_service_cabinet_', 'equipment_rolling_tool_cabinet_',
        'equipment_rolling_tool_chest_', 'equipment_rolling_workstation_cabinet_',
        'fixture_cabinet_', 'fixture_counter_', 'fixture_island_',
        'stool_mobile_padded_vinyl_', 'chair_office_amf_black_', 'chair_office_fabric_manager_',
        'warehouse_chair_office_', 'workshopSystem_scheduleBoard_', 'arm_articulated_support_'
    )):
        return 'workbench_furniture'

    # ==========================================
    # 5. HAND TOOLS & WORKSHOP TOOLS (hand_tools)
    # ==========================================
    # Hammers, mallets, cutters, knives, pliers, pry bars, wrenches, screwdrivers, clamps, jacks, toolboxes
    if cat in ['handTool']:
        return 'hand_tools'
    if asset.startswith((
        'handTool_', 'tool_clamp_', 'tool_cutting_hobbyknife_', 'tool_hammer_', 'tool_pliers_',
        'tool_tape_duct_', 'utensils_scissors_', 'powerTool_drill_', 'powerTool_grinder_',
        'powerTool_heatGun_', 'powerTool_impact_wrench_', 'powerTool_saw_', 'powerTool_cutting_tool_',
        'equipment_bench_vise_', 'equipment_machine_vise_', 'serviceTool_funnel_',
        'serviceTool_greaseGun_', 'serviceTool_inflator_', 'serviceTool_gauge_',
        'serviceTool_pliers_oilFilter_', 'serviceTool_wrench_hoseFitting_', 'serviceTool_camera_inspection',
        'serviceTool_sprayGun', 'vehicleSupport_jack_bottleHydraulic_', 'vehicleSupport_jack_stand_',
        'vehicleSupport_floor_jack_', 'storage_toolbox_carry_hardCase_', 'storage_toolbox_foldout_hardCase_',
        'storage_toolbox_standard_hardCase_'
    )):
        return 'hand_tools'

    # ==========================================
    # 6. LOGISTICS (logistics)
    # ==========================================
    # Pallets, crates, boxes, racks, shelves, carts, trolleys, hand trucks, forklifts, conveyors, drums, bins
    if cat in ['pallet', 'crate', 'box', 'rack', 'storageSystem', 'shelve', 'handTruck', 'tiltTruck',
               'palletJack', 'drum', 'pail', 'conveyor', 'hopper', 'ladder', 'scaffold', 'bucket',
               'bin', 'trashCan', 'wasteManagement', 'waste']:
        return 'logistics'
    if asset.startswith((
        'pallet_', 'crate_', 'box_', 'rack_', 'storageSystem_', 'shelve_', 'handTruck_',
        'tiltTruck_', 'palletJack_', 'drum_', 'pail_', 'conveyor_', 'hopper_', 'ladder_',
        'scaffold_', 'bucket_', 'bin_', 'trashCan_', 'wasteManagement_', 'waste_',
        'furniture_trashBin_lid_', 'cart_luggage_platform_', 'cart_mobile_', 'cart_computer_',
        'cart_equipment_diagnostic_', 'trolley_catering_', 'trolley_cleaning_', 'trolley_wheelBase_',
        'vehicle_forklift_', 'storage_basket_', 'storage_box_', 'storage_shelf_', 'storage_tire_rack_',
        'vehicleSupport_rolling_dolly_', 'vehicleSupport_hydraulic_rolling_platform_',
        'vehicleSupport_scissor_lift_', 'vehicleSupport_portable_lift_', 'construction_wheelbarrow_',
        'equipment_angle_bin_cart_', 'equipment_liftTable_scissorMobile_', 'equipment_mechanic_tool_cart_',
        'equipment_mechanic_work_tray_cart_', 'equipment_multi_tier_bin_cart_', 'equipment_storage_bin_cart_',
        'equipment_tool_organizer_cart_', 'equipment_tools_trolley_', 'equipment_trash_trolley_',
        'equipment_utility_cart_', 'warehouse_barrel_plastic_', 'warehouse_box_cube_',
        'ramp_long_', 'tape_transportRack_', 'barrier_fence_metal_', 'barrier_wall_plastic_orange_',
        'environment_fence_'
    )):
        return 'logistics'
    if asset.startswith(('container_black_c04', 'container_glossy_black_c04', 'container_gray_c04',
                         'container_orange_c04', 'container_white_c04', 'container_plastic_grit_',
                         'container_recycle_')):
        return 'logistics'

    return None

def main():
    metadata_path = 'scripts/assets/simready_metadata.jsonl'
    output_path = 'scripts/assets/curated_simready_assets.json'

    with open(metadata_path, 'r', encoding='utf-8') as f:
        items = [json.loads(line) for line in f if line.strip()]

    print(f'Total input SimReady assets: {len(items)}')

    curated = []
    category_counts = defaultdict(int)
    by_category = defaultdict(list)

    for item in items:
        suggested_cat = classify(item)
        if suggested_cat is not None:
            category_counts[suggested_cat] += 1
            curated_item = {
                'asset': item['asset'],
                'category': suggested_cat,
                'original_category': item.get('category'),
                'triangles': item.get('triangles', 0),
                'draw_calls': item.get('draw_calls', 0),
                'size_mb': item.get('size_mb', 0.0),
                'glb': item.get('glb', ''),
                'file_name': item.get('file_name', '')
            }
            curated.append(curated_item)
            by_category[suggested_cat].append(curated_item)

    # Sort curated assets by category, then by asset name
    curated.sort(key=lambda x: (x['category'], x['asset']))

    output_data = {
        'total_curated': len(curated),
        'total_source': len(items),
        'categories': {cat: len(by_category[cat]) for cat in sorted(category_counts.keys())},
        'assets': curated
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f'\nSaved {len(curated)} curated assets to {output_path}')
    print('\nBreakdown by category:')
    for cat in ['logistics', 'workbench_furniture', 'mep_climate', 'hand_tools', 'safety', 'harvest_produce']:
        count = category_counts[cat]
        print(f'  - {cat}: {count} assets')

if __name__ == '__main__':
    main()
