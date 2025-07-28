/**
 * 极简Schema修补函数：为缺少items的数组类型添加最小合法定义
 * @param schema 原始JSON Schema
 * @param options 配置项（可选）
 * @returns 修补后的Schema（原Schema保持不变）
 */
function patchSchemaArrays(schema, options) {
    options = options || {};
    var log = options.log;
    var defaultItems = options.defaultItems || { type: "object" };
    var newSchema = JSON.parse(JSON.stringify(schema));
    function processObject(node, path) {
        path = path || [];
        if (node && node.properties) {
            Object.keys(node.properties).forEach(function(key) {
                var prop = node.properties[key];
                if (Array.isArray(prop.type) && prop.type.length > 1) {
                    prop.type = prop.type[0];
                }
                if (prop.type === "array" && !prop.items) {
                    prop.items = defaultItems;
                    if (log) {
                        console.log("[SimplePatcher] 修补属性: " + path.concat([key]).join("."), prop);
                    }
                }
                if (prop.type === "object") {
                    processObject(prop, path.concat([key]));
                }
            });
        }
        if (node && node.items && node.items.type === "array" && !node.items.items) {
            node.items.items = defaultItems;
            if (log) {
                console.log("[SimplePatcher] 修补嵌套数组: " + path.concat(["items"]).join("."), node.items);
            }
        }
    }
    if (newSchema.type === "object") {
        processObject(newSchema, []);
    }
    return newSchema;
}

module.exports = {
    patchSchemaArrays: patchSchemaArrays
};
