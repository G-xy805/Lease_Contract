// 物品清单字段映射配置
export interface InventoryMapping {
  name: string;           // 物品名称
  templateField: string; // 对应的模板HTML字段名
  unit: string;           // 单位
}

export const INVENTORY_MAPPINGS: InventoryMapping[] = [
  { name: '电视', templateField: 'item_tv_qty', unit: '台' },
  { name: '电视（遥控器）', templateField: 'item_tv_remote_qty', unit: '个' },
  { name: '机顶盒（遥控器）', templateField: 'item_box_qty', unit: '个' },
  { name: '茶几', templateField: 'item_coffee_table_qty', unit: '个' },
  { name: '餐桌椅子', templateField: 'item_chair_qty', unit: '把' },
  { name: '床头柜', templateField: 'item_nightstand_qty', unit: '个' },
  { name: '空调', templateField: 'item_ac_qty', unit: '台' },
  { name: '空调（遥控器）', templateField: 'item_ac_remote_qty', unit: '个' },
  { name: '冰箱', templateField: 'item_fridge_qty', unit: '台' },
  { name: '洗衣机', templateField: 'item_washer_qty', unit: '台' },
  { name: '煤气灶', templateField: 'item_gas_stove_qty', unit: '台' },
  { name: '电磁灶', templateField: 'item_induction_qty', unit: '台' },
  { name: '水卡', templateField: 'item_water_card_qty', unit: '个' },
  { name: '衣柜', templateField: 'item_wardrobe_qty', unit: '个' },
  { name: '电视柜', templateField: 'item_tv_table_qty', unit: '个' },
  { name: '沙发', templateField: 'item_sofa_qty', unit: '个' },
  { name: '餐桌', templateField: 'item_dining_table_qty', unit: '张' },
  { name: '床', templateField: 'item_bed_qty', unit: '张' },
  { name: '窗帘', templateField: 'item_curtain_qty', unit: '个' },
  { name: '床垫子', templateField: 'item_mattress_qty', unit: '个' },
  { name: '热水器', templateField: 'item_water_heater_qty', unit: '台' },
  { name: '油烟机', templateField: 'item_hood_qty', unit: '台' },
  { name: '门禁卡', templateField: 'item_door_card_qty', unit: '个' },
  { name: '电卡', templateField: 'item_power_card_qty', unit: '个' },
];

// 根据名称查找映射
export const getMappingByName = (name: string): InventoryMapping | undefined => {
  return INVENTORY_MAPPINGS.find(m => m.name === name);
};

// 工具函数：将前端格式转为数据库存储格式
export const itemsToInventoryJson = (items: Array<{name: string, quantity: number}>): string => {
  return JSON.stringify(items);
};

// 工具函数：将数据库存储格式转为PDF生成格式
export const inventoryJsonToTemplateData = (inventoryJson: string | null): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!inventoryJson) {
    // 返回默认值
    INVENTORY_MAPPINGS.forEach(m => {
      result[m.templateField] = '0';
    });
    return result;
  }

  try {
    const items = JSON.parse(inventoryJson);
    // 初始化所有字段为0
    INVENTORY_MAPPINGS.forEach(m => {
      result[m.templateField] = '0';
    });
    // 填充有值的字段
    items.forEach((item: {name: string, quantity: number}) => {
      const mapping = getMappingByName(item.name);
      if (mapping) {
        result[mapping.templateField] = item.quantity.toString();
      }
    });
  } catch (e) {
    console.error('解析inventory_items失败:', e);
  }
  return result;
};